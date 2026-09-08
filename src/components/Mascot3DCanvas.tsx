import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { MascotMood } from "./SymbioticAvatar";

interface Mascot3DCanvasProps {
  mood?: MascotMood;
  size?: "sm" | "md" | "lg";
  onTap?: () => void;
  className?: string;
}

export function Mascot3DCanvas({
  mood = "balanced",
  size = "md",
  onTap,
  className = "",
}: Mascot3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoadingGlb, setIsLoadingGlb] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  // Keep latest mood and onTap in refs for the animation loop
  const moodRef = useRef(mood);
  moodRef.current = mood;

  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 220;
    const height = container.clientHeight || 220;

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // Balanced perspective camera (30 deg FOV at distance 4.3 prevents wide-angle distortion)
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0.05, 4.3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // --- Studio 3-Point Lighting Rig (Soft, diffuse Pixar lighting - zero harsh shadows) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Key Light (Warm soft white from top-front-right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2.5, 4.0, 3.5);
    scene.add(keyLight);

    // Fill Light (Soft sky cyan from lower-left)
    const fillLight = new THREE.DirectionalLight(0x67e8f9, 0.6);
    fillLight.position.set(-3.0, -1.5, 2.5);
    scene.add(fillLight);

    // Rim / Back Light (Soft pastel pink/violet rim glow)
    const rimLight = new THREE.DirectionalLight(0xf472b6, 0.8);
    rimLight.position.set(0.0, 2.5, -3.0);
    scene.add(rimLight);

    // Mascot Group Hierarchy
    const mascotGroup = new THREE.Group();
    scene.add(mascotGroup);

    // Inner group for tap squish & breathing oscillator
    const innerAnimGroup = new THREE.Group();
    mascotGroup.add(innerAnimGroup);

    // Face group for 3D eyes, cheeks, mouth that rotate with the front
    const faceGroup = new THREE.Group();
    innerAnimGroup.add(faceGroup);

    // Track resources for clean disposal
    const disposables: Array<{ dispose: () => void }> = [];

    // Helper to generate the exact pastel gradient texture matching the 2D renders
    function createBodyTexture(currentMood: MascotMood) {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      if (currentMood === "stressed") {
        gradient.addColorStop(0.0, "#fb923c"); // warm amber top
        gradient.addColorStop(0.4, "#f43f5e"); // pink
        gradient.addColorStop(1.0, "#a855f7"); // purple base
      } else if (currentMood === "exhausted") {
        gradient.addColorStop(0.0, "#67e8f9"); // soft cyan
        gradient.addColorStop(0.5, "#94a3b8"); // slate
        gradient.addColorStop(1.0, "#64748b"); // deep slate
      } else if (currentMood === "focused") {
        gradient.addColorStop(0.0, "#0ea5e9"); // bright cyan
        gradient.addColorStop(0.5, "#6366f1"); // indigo
        gradient.addColorStop(1.0, "#8b5cf6"); // violet
      } else if (currentMood === "happy") {
        gradient.addColorStop(0.0, "#22d3ee"); // bright sunny cyan
        gradient.addColorStop(0.4, "#38bdf8"); // sky
        gradient.addColorStop(1.0, "#c084fc"); // purple
      } else {
        // Balanced (Exact match with companion-balanced.png)
        gradient.addColorStop(0.0, "#38d2f5"); // bright pastel cyan top
        gradient.addColorStop(0.35, "#56ccf2"); // smooth cyan-blue
        gradient.addColorStop(0.65, "#8fa0f8"); // soft periwinkle
        gradient.addColorStop(0.88, "#be88fa"); // pastel lilac
        gradient.addColorStop(1.0, "#c084fc"); // soft purple bottom
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      disposables.push(texture);
      return texture;
    }

    // Shared materials
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.05,
    });
    disposables.push(eyeMat);

    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xff7a98,
      roughness: 0.55,
      metalness: 0.0,
    });
    disposables.push(cheekMat);

    const armMat = new THREE.MeshStandardMaterial({
      color: 0x76c7f8,
      roughness: 0.4,
      metalness: 0.0,
    });
    disposables.push(armMat);

    const footMat = new THREE.MeshStandardMaterial({
      color: 0xb57bf4,
      roughness: 0.4,
      metalness: 0.0,
    });
    disposables.push(footMat);

    let bodyMaterial: THREE.MeshPhysicalMaterial | null = null;

    // Build the 3D Face elements with accurate proportions
    function buildFace(currentMood: MascotMood) {
      // Clear existing face meshes
      while (faceGroup.children.length > 0) {
        const child = faceGroup.children[0];
        if (child) faceGroup.remove(child);
      }

      // 1. Prominent Pink Blush Cheeks (Exact pill/oval shape from 2D artwork)
      const cheekGeom = new THREE.SphereGeometry(0.11, 24, 24);
      disposables.push(cheekGeom);

      const leftCheek = new THREE.Mesh(cheekGeom, cheekMat);
      leftCheek.scale.set(1.35, 0.8, 0.25);
      leftCheek.position.set(-0.44, -0.04, 0.9);
      leftCheek.rotation.set(0, -0.42, 0.08);
      faceGroup.add(leftCheek);

      const rightCheek = leftCheek.clone();
      rightCheek.position.set(0.44, -0.04, 0.9);
      rightCheek.rotation.set(0, 0.42, -0.08);
      faceGroup.add(rightCheek);

      // 2. Eyes & Mouth depending on mood
      if (currentMood === "happy") {
        // Happy upturned curved smiling eyes (^  ^)
        const eyeGeom = new THREE.TorusGeometry(0.065, 0.016, 16, 24, Math.PI * 0.85);
        disposables.push(eyeGeom);

        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.25, 0.11, 0.98);
        leftEye.rotation.set(0, -0.22, Math.PI * 0.1);
        faceGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.25, 0.11, 0.98);
        rightEye.rotation.set(0, 0.22, -Math.PI * 0.1);
        faceGroup.add(rightEye);

        // Open happy mouth with tongue
        const mouthGeom = new THREE.TorusGeometry(0.055, 0.016, 16, 24, Math.PI * 0.9);
        disposables.push(mouthGeom);
        const mouth = new THREE.Mesh(mouthGeom, eyeMat);
        mouth.position.set(0, 0.0, 1.015);
        mouth.rotation.set(0, 0, Math.PI * 1.05);
        faceGroup.add(mouth);
      } else if (currentMood === "focused") {
        // Attentive cute pill/dot eyes with specular glint
        const eyeGeom = new THREE.CapsuleGeometry(0.038, 0.055, 16, 16);
        disposables.push(eyeGeom);

        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.25, 0.1, 0.98);
        faceGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.25, 0.1, 0.98);
        faceGroup.add(rightEye);

        // Specular glint in eyes
        const glintGeom = new THREE.SphereGeometry(0.014, 12, 12);
        const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        disposables.push(glintGeom, glintMat);

        const leftGlint = new THREE.Mesh(glintGeom, glintMat);
        leftGlint.position.set(-0.24, 0.12, 1.02);
        faceGroup.add(leftGlint);

        const rightGlint = new THREE.Mesh(glintGeom, glintMat);
        rightGlint.position.set(0.26, 0.12, 1.02);
        faceGroup.add(rightGlint);

        // Small calm line mouth
        const mouthGeom = new THREE.CapsuleGeometry(0.012, 0.06, 16, 16);
        disposables.push(mouthGeom);
        const mouth = new THREE.Mesh(mouthGeom, eyeMat);
        mouth.position.set(0, 0.01, 1.015);
        mouth.rotation.set(0, 0, Math.PI / 2);
        faceGroup.add(mouth);
      } else if (currentMood === "exhausted") {
        // Slumped sleepy closed eyes (downward slanted)
        const eyeGeom = new THREE.TorusGeometry(0.07, 0.018, 16, 24, Math.PI * 0.75);
        disposables.push(eyeGeom);

        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.25, 0.08, 0.98);
        leftEye.rotation.set(0, -0.22, -0.2);
        faceGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.25, 0.08, 0.98);
        rightEye.rotation.set(0, 0.22, 0.2);
        faceGroup.add(rightEye);

        // Sleepy yawning mouth 'o'
        const mouthGeom = new THREE.TorusGeometry(0.04, 0.014, 16, 24, Math.PI * 2);
        disposables.push(mouthGeom);
        const mouth = new THREE.Mesh(mouthGeom, eyeMat);
        mouth.position.set(0, -0.01, 1.015);
        faceGroup.add(mouth);
      } else if (currentMood === "stressed") {
        // Worried eyes (>  <)
        const eyeLineGeom = new THREE.CapsuleGeometry(0.015, 0.07, 16, 16);
        disposables.push(eyeLineGeom);

        const eye1 = new THREE.Mesh(eyeLineGeom, eyeMat);
        eye1.position.set(-0.27, 0.11, 0.98);
        eye1.rotation.set(0, 0, 0.7);
        faceGroup.add(eye1);

        const eye2 = new THREE.Mesh(eyeLineGeom, eyeMat);
        eye2.position.set(-0.27, 0.07, 0.98);
        eye2.rotation.set(0, 0, -0.7);
        faceGroup.add(eye2);

        const eye3 = new THREE.Mesh(eyeLineGeom, eyeMat);
        eye3.position.set(0.27, 0.11, 0.98);
        eye3.rotation.set(0, 0, -0.7);
        faceGroup.add(eye3);

        const eye4 = new THREE.Mesh(eyeLineGeom, eyeMat);
        eye4.position.set(0.27, 0.07, 0.98);
        eye4.rotation.set(0, 0, 0.7);
        faceGroup.add(eye4);

        // Wavy mouth
        const mouthGeom = new THREE.TorusGeometry(0.04, 0.013, 16, 24, Math.PI * 0.75);
        disposables.push(mouthGeom);
        const mouth = new THREE.Mesh(mouthGeom, eyeMat);
        mouth.position.set(0, 0.01, 1.015);
        mouth.rotation.set(0, 0, -0.3);
        faceGroup.add(mouth);
      } else {
        // Balanced (Default: Sweet closed calm smiling eyes and cat smile matching 2D art)
        const eyeGeom = new THREE.TorusGeometry(0.07, 0.018, 16, 24, Math.PI * 0.75);
        disposables.push(eyeGeom);

        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.25, 0.1, 0.98);
        leftEye.rotation.set(0, -0.22, 0.25);
        faceGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.25, 0.1, 0.98);
        rightEye.rotation.set(0, 0.22, -0.25);
        faceGroup.add(rightEye);

        // Sweet gentle smile
        const mouthGeom = new THREE.TorusGeometry(0.045, 0.014, 16, 24, Math.PI * 0.75);
        disposables.push(mouthGeom);
        const mouth = new THREE.Mesh(mouthGeom, eyeMat);
        mouth.position.set(0, 0.02, 1.015);
        mouth.rotation.set(0, 0, Math.PI * 1.125);
        faceGroup.add(mouth);
      }
    }

    // Build the chubby, squishy 3D procedural character
    function buildProceduralMascot() {
      const bodyTex = createBodyTexture(moodRef.current);
      bodyMaterial = new THREE.MeshPhysicalMaterial({
        map: bodyTex,
        roughness: 0.38,
        metalness: 0.02,
        clearcoat: 0.3,
        clearcoatRoughness: 0.35,
        reflectivity: 0.5,
      });
      disposables.push(bodyMaterial);

      // Chubby round body (Width 1.06, Height 0.98, Depth 1.02 - round dumpling shape!)
      const bodyGeom = new THREE.SphereGeometry(1.0, 64, 64);
      disposables.push(bodyGeom);

      const bodyMesh = new THREE.Mesh(bodyGeom, bodyMaterial);
      bodyMesh.scale.set(1.06, 0.98, 1.02);
      innerAnimGroup.add(bodyMesh);

      // Cute Stubby Arm / Hand (Left nub tucked against lower tummy)
      const armGeom = new THREE.CapsuleGeometry(0.075, 0.12, 16, 16);
      disposables.push(armGeom);

      const armLeft = new THREE.Mesh(armGeom, armMat);
      armLeft.position.set(-0.38, -0.22, 0.88);
      armLeft.rotation.set(-0.15, 0.35, 0.65);
      innerAnimGroup.add(armLeft);

      // Cute Stubby Arm / Hand (Right nub tucked against lower tummy)
      const armRight = new THREE.Mesh(armGeom, armMat);
      armRight.position.set(0.38, -0.22, 0.88);
      armRight.rotation.set(-0.15, -0.35, -0.65);
      innerAnimGroup.add(armRight);

      // Cute Stubby Feet (Left & Right nubs pointing down at base)
      const footGeom = new THREE.CapsuleGeometry(0.085, 0.12, 16, 16);
      disposables.push(footGeom);

      const footLeft = new THREE.Mesh(footGeom, footMat);
      footLeft.position.set(-0.25, -0.92, 0.06);
      footLeft.rotation.set(0.12, 0, -0.15);
      innerAnimGroup.add(footLeft);

      const footRight = new THREE.Mesh(footGeom, footMat);
      footRight.position.set(0.25, -0.92, 0.06);
      footRight.rotation.set(0.12, 0, 0.15);
      innerAnimGroup.add(footRight);

      // Build face
      buildFace(moodRef.current);
    }

    // Check if custom .glb model exists at /models/companion.glb
    const checkAndLoadCustomGlb = async () => {
      try {
        const response = await fetch("/models/companion.glb", { method: "HEAD" });
        if (response.ok) {
          setIsLoadingGlb(true);
          const loader = new GLTFLoader();
          loader.load(
            "/models/companion.glb",
            (gltf) => {
              while (innerAnimGroup.children.length > 0) {
                const child = innerAnimGroup.children[0];
                if (child) innerAnimGroup.remove(child);
              }

              const box = new THREE.Box3().setFromObject(gltf.scene);
              const sizeVec = new THREE.Vector3();
              box.getSize(sizeVec);
              const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
              const scale = 2.0 / (maxDim || 1);
              gltf.scene.scale.setScalar(scale);

              const center = new THREE.Vector3();
              box.getCenter(center);
              gltf.scene.position.sub(center.multiplyScalar(scale));

              innerAnimGroup.add(gltf.scene);
              setIsLoadingGlb(false);
            },
            undefined,
            () => {
              setIsLoadingGlb(false);
              buildProceduralMascot();
            },
          );
        } else {
          buildProceduralMascot();
        }
      } catch {
        buildProceduralMascot();
      }
    };

    checkAndLoadCustomGlb();

    // --- Interactive 360° Drag & Physics ---
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let rotationY = 0; // unlimited 360 rotation around Y
    let rotationX = 0; // clamped tilt (-0.35 to 0.35 rad)

    // Tap squish physics variables
    let squishVelocity = 0;
    let squishProgress = 0; // 0 = rest, >0 = squished

    function triggerSquish() {
      squishProgress = 1.0;
      squishVelocity = 0;
      onTapRef.current?.();
      setHintVisible(false);
    }

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      velocityX = 0;
      velocityY = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
      setHintVisible(false);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      velocityX = deltaX * 0.009;
      velocityY = deltaY * 0.006;

      rotationY += velocityX;
      rotationX = Math.max(-0.35, Math.min(0.35, rotationX + velocityY));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if not captured
      }

      // If pointer barely moved, count as tap
      const dist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
      if (dist < 6) {
        triggerSquish();
      }
    };

    const canvasDom = renderer.domElement;
    canvasDom.style.touchAction = "none";
    canvasDom.style.cursor = "grab";
    canvasDom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // --- Animation Loop ---
    let animId = 0;
    const clock = new THREE.Clock();
    let currentMoodCached = moodRef.current;

    const render = () => {
      animId = requestAnimationFrame(render);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Check for mood updates live
      if (currentMoodCached !== moodRef.current) {
        currentMoodCached = moodRef.current;
        if (bodyMaterial) {
          const newBodyTex = createBodyTexture(currentMoodCached);
          if (newBodyTex) {
            bodyMaterial.map = newBodyTex;
            bodyMaterial.needsUpdate = true;
          }
        }
        buildFace(currentMoodCached);
      }

      // Physics: Apply inertia & damping when released
      if (!isDragging) {
        rotationY += velocityX;
        rotationX += velocityY;

        velocityX *= 0.92;
        velocityY *= 0.92;

        // Softly spring vertical tilt back upright
        rotationX += (0 - rotationX) * 0.06;

        // Subtle gentle idle floating drift when untouched
        if (Math.abs(velocityX) < 0.001) {
          rotationY += Math.sin(elapsedTime * 0.8) * 0.0012;
        }
      }

      // Apply rotations
      mascotGroup.rotation.y = rotationY;
      mascotGroup.rotation.x = rotationX;

      // Tap Squish Spring Oscillator (F = -k*x - c*v)
      if (squishProgress > 0.001 || Math.abs(squishVelocity) > 0.001) {
        const springK = 35.0;
        const dampingC = 7.0;
        const force = -springK * squishProgress - dampingC * squishVelocity;
        squishVelocity += force * delta;
        squishProgress += squishVelocity * delta;

        // Squash height slightly, puff width
        const squishY = 1.0 - squishProgress * 0.18;
        const squishXZ = 1.0 + squishProgress * 0.14;
        innerAnimGroup.scale.set(squishXZ, squishY, squishXZ);
      } else {
        // Natural gentle chubby breathing (keeps dumpling roundness)
        const breathe = Math.sin(elapsedTime * 2.2) * 0.014;
        innerAnimGroup.scale.set(1.0 + breathe, 1.0 - breathe * 0.6, 1.0 + breathe);
      }

      // Gentle vertical floating bob
      innerAnimGroup.position.y = Math.sin(elapsedTime * 2.0) * 0.04;

      renderer.render(scene, camera);
    };

    render();

    // --- Resize Handler ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // --- Cleanup on unmount ---
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvasDom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      if (canvasDom.parentElement) {
        canvasDom.parentElement.removeChild(canvasDom);
      }
    };
  }, []);

  const sizeDimensions = {
    sm: "h-14 w-14",
    md: "h-44 w-44",
    lg: "h-56 w-56",
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none overflow-hidden ${sizeDimensions} ${className}`}
    >
      {/* 360 Drag Hint Tooltip (fades after first drag) */}
      {hintVisible && size !== "sm" && (
        <div className="absolute top-2 z-10 pointer-events-none rounded-full bg-black/40 px-2.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-md animate-pulse">
          Drag 360° • Tap to bounce
        </div>
      )}

      {isLoadingGlb && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-xs text-[10px] text-muted-foreground font-medium">
          Loading 3D mesh...
        </div>
      )}
    </div>
  );
}
