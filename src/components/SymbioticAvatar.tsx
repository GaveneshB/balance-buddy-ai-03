import companionHappy from "@/assets/companion-happy.png";
import companionBalanced from "@/assets/companion-balanced.png";
import companionFocused from "@/assets/companion-focused.png";
import companionStressed from "@/assets/companion-stressed.png";
import companionExhausted from "@/assets/companion-exhausted.png";
import { ambientAudio } from "@/lib/ambient-audio";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

export type MascotMood = "happy" | "balanced" | "focused" | "stressed" | "exhausted";

export const moodImages: Record<MascotMood, string> = {
  happy: companionHappy,
  balanced: companionBalanced,
  focused: companionFocused,
  stressed: companionStressed,
  exhausted: companionExhausted,
};

export function getMascotMood(capacity: number): {
  mood: MascotMood;
  label: string;
  emoji: string;
  color: string;
  quote: string;
} {
  if (capacity <= 29) {
    return {
      mood: "happy",
      label: "Ecstatic & Energized",
      emoji: "😄",
      color: "#3dcd00",
      quote: "“I’m feeling super energized! Let’s crush some goals today!”",
    };
  }
  if (capacity >= 30 && capacity <= 44) {
    return {
      mood: "balanced",
      label: "Happy & Balanced",
      emoji: "😊",
      color: "var(--safe)",
      quote: "“Your capacity is nicely balanced. Smooth sailing ahead.”",
    };
  }
  if (capacity >= 45 && capacity <= 69) {
    return {
      mood: "focused",
      label: "Focused & Busy",
      emoji: "😐",
      color: "#eab308",
      quote: "“Workload is picking up. I’m staying sharp and focused.”",
    };
  }
  if (capacity >= 70 && capacity <= 84) {
    return {
      mood: "stressed",
      label: "Stressed & Overloaded",
      emoji: "😫",
      color: "#ff863a",
      quote: "“Phew! Workload is getting way too high! Let’s rebalance soon!”",
    };
  }
  return {
    mood: "exhausted",
    label: "Exhausted / Burnout Lock",
    emoji: "😴",
    color: "var(--danger)",
    quote: "“Total overload! I’m completely slumped... step away for a reset!”",
  };
}

export function SymbioticAvatar({
  capacity,
  size = "md",
  className,
  showQuote = false,
}: {
  capacity: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showQuote?: boolean;
}) {
  const { mode } = usePrefs();
  const naturalInfo = getMascotMood(capacity);

  // Manual mood override for demonstration & testing
  const [overrideMood, setOverrideMood] = useState<MascotMood | null>(null);
  const activeMood = overrideMood ?? naturalInfo.mood;
  const info = overrideMood
    ? {
        ...naturalInfo,
        mood: overrideMood,
        label:
          overrideMood === "happy"
            ? "Ecstatic & Energized"
            : overrideMood === "balanced"
              ? "Happy & Balanced"
              : overrideMood === "focused"
                ? "Focused & Busy"
                : overrideMood === "stressed"
                  ? "Stressed & Overloaded"
                  : "Exhausted / Burnout Lock",
        emoji:
          overrideMood === "happy"
            ? "😄"
            : overrideMood === "balanced"
              ? "😊"
              : overrideMood === "focused"
                ? "😐"
                : overrideMood === "stressed"
                  ? "😫"
                  : "😴",
        color:
          overrideMood === "happy"
            ? "var(--safe)"
            : overrideMood === "balanced"
              ? "var(--teal)"
              : overrideMood === "focused"
                ? "var(--warn)"
                : "var(--danger)",
        quote:
          overrideMood === "happy"
            ? "“I’m feeling super energized! Let’s crush some goals today!”"
            : overrideMood === "balanced"
              ? "“Your capacity is nicely balanced. Smooth sailing ahead.”"
              : overrideMood === "focused"
                ? "“Workload is picking up. I’m staying sharp and focused.”"
                : overrideMood === "stressed"
                  ? "“Phew! Workload is getting way too high! Let’s rebalance soon!”"
                  : "“Total overload! I’m completely slumped... step away for a reset!”",
      }
    : naturalInfo;

  // Interactive tap & 3D spin physics
  const [isJiggling, setIsJiggling] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [clickMessage, setClickMessage] = useState<string | null>(null);

  // 3D Mouse & Touch Parallax Tilt
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (mode === "autism" || !cardRef.current || isDragging) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2)));
    const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2)));
    setTilt({ x: normX, y: normY });
  }

  function handleMouseLeave() {
    if (!isDragging) {
      setTilt({ x: 0, y: 0 });
    }
  }

  // Pointer drag & 3D flick-to-spin
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (mode === "autism") return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStartRef.current.x) / (rect.width / 2);
    const deltaY = (e.clientY - dragStartRef.current.y) / (rect.height / 2);
    setTilt({
      x: Math.max(-1.5, Math.min(1.5, deltaX)),
      y: Math.max(-1.5, Math.min(1.5, deltaY)),
    });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const dist = Math.hypot(deltaX, deltaY);

    // If flicked or swiped horizontally (>30px), trigger a full 360° 3D spin!
    if (Math.abs(deltaX) > 30 && !isSpinning) {
      trigger3DSpin();
    } else if (dist < 8) {
      // Tap reaction
      handleAvatarTap();
    }

    // Spring back tilt
    setTilt({ x: 0, y: 0 });
  }

  // 360 Spin reaction
  function trigger3DSpin() {
    setIsSpinning(true);
    ambientAudio.playCelebrationChime();
    setClickMessage("✨ 360° Spin! Wheeeee!");
    setTimeout(() => setIsSpinning(false), 900);
    setTimeout(() => setClickMessage(null), 3000);
  }

  // Tap reaction
  function handleAvatarTap() {
    setIsJiggling(true);
    ambientAudio.playCelebrationChime();

    const phrases = [
      "✨ Wheee! Thanks for checking in with me!",
      "💫 You're doing amazing, keep your momentum!",
      "🌟 I'm right here with you, Dhanesh!",
      "❤️ One micro-step at a time!",
      "🎉 High five! Let's conquer today!",
    ];
    const picked = phrases[Math.floor(Math.random() * phrases.length)] ?? phrases[0]!;
    setClickMessage(picked);

    setTimeout(() => setIsJiggling(false), 650);
    setTimeout(() => setClickMessage(null), 3500);
  }

  // Cycle mood on badge tap (instant demo switcher)
  function handleCycleMood(e: React.MouseEvent) {
    e.stopPropagation();
    const cycle: Array<MascotMood | null> = [
      "happy",
      "balanced",
      "focused",
      "stressed",
      "exhausted",
      null, // Return to automatic capacity-driven mode
    ];
    const currIdx = cycle.indexOf(overrideMood);
    const nextMood = cycle[(currIdx + 1) % cycle.length] ?? null;
    setOverrideMood(nextMood);
    ambientAudio.playCelebrationChime();
  }

  const currentImg = moodImages[activeMood];

  const sizeClasses = {
    sm: "h-12 w-12 rounded-2xl",
    md: "h-44 w-44 rounded-[32px]",
    lg: "h-56 w-56 rounded-[36px]",
  }[size];

  const imgSizeClasses = {
    sm: "h-10 w-10",
    md: "h-36 w-36",
    lg: "h-48 w-48",
  }[size];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative flex flex-col items-center justify-center select-none pt-2", className)}
    >
      {/* Interactive Speech Toast on Tap - clearly positioned above without clipping */}
      {clickMessage && (
        <div className="mb-2 z-30 inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-warm)] px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-lg animate-in zoom-in-95 fade-in duration-200">
          <span>{clickMessage}</span>
        </div>
      )}

      {/* Mascot Glass Frame with 3D Spatial Tilt & Physics */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Symbiotic mascot: ${info.label}. Tap or swipe to interact.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleAvatarTap();
        }}
        className={cn(
          "relative flex items-center justify-center transition-all duration-200 overflow-hidden cursor-grab active:cursor-grabbing",
          sizeClasses,
          mode !== "autism" && "mascot-breathe",
          isJiggling && "mascot-jiggle",
          isSpinning && "mascot-spin-3d",
        )}
        style={{
          background: `color-mix(in oklab, ${info.color} ${info.mood === "stressed" || info.mood === "exhausted" ? "22%" : "14%"}, transparent)`,
          boxShadow: `inset 0 0 50px -10px ${info.color}, 0 16px 40px -12px ${info.color}`,
          transform:
            mode !== "autism"
              ? `perspective(800px) rotateX(${-tilt.y * 14}deg) rotateY(${tilt.x * 16}deg) ${isDragging ? "scale(1.05) translateZ(20px)" : "scale(1)"}`
              : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Dynamic ambient aura border */}
        {mode !== "autism" && (
          <div
            className={cn(
              "absolute inset-0 rounded-inherit opacity-40 transition-all duration-500 pointer-events-none",
              info.mood === "stressed"
                ? "animate-pulse"
                : info.mood === "happy" || info.mood === "balanced"
                  ? "float-soft"
                  : "",
            )}
            style={{
              border: `2px solid ${info.color}`,
            }}
          />
        )}

        {/* Dynamic Light Sheen Glare on Drag / Tilt */}
        {mode !== "autism" && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${50 + tilt.x * 35}% ${50 + tilt.y * 35}%, rgba(255, 255, 255, 0.45) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* 3D Character Render with Smooth Fade Transition */}
        <div
          className={cn(
            "relative flex items-center justify-center transition-all duration-500 select-none pointer-events-none",
            info.mood === "happy" && mode !== "autism" && "scale-105",
            info.mood === "stressed" && "scale-95 rotate-[-2deg]",
            info.mood === "exhausted" && "scale-92 translate-y-1 rotate-[-2deg]",
          )}
        >
          <img
            key={activeMood}
            src={currentImg}
            alt={`BalanceAI mascot: ${info.label}`}
            width={768}
            height={768}
            className={cn(
              "object-contain transition-all duration-500 select-none pointer-events-none animate-in fade-in zoom-in-95 duration-300 drop-shadow-md",
              imgSizeClasses,
            )}
          />
        </div>
      </div>

      {/* Emotion Badge Pill & Interaction Hint */}
      {size !== "sm" && (
        <div className="mt-3.5 z-20 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={handleCycleMood}
            title="Click to preview different mascot expressions!"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: info.color }}
          >
            <span>{info.emoji}</span>
            <span>{info.label}</span>
            {overrideMood ? (
              <span className="rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-mono tracking-normal">
                cycle
              </span>
            ) : (
              <span className="rounded bg-black/20 px-1.5 py-0.5 text-[9px] font-mono opacity-80">
                tap to test
              </span>
            )}
          </button>
          <span className="text-[10px] text-muted-foreground/80 font-medium tracking-tight">
            Swipe to spin 360° • Tap to squish
          </span>
        </div>
      )}

      {size === "sm" && (
        <span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] shadow-sm"
          style={{ backgroundColor: info.color, color: "#fff" }}
          title={info.label}
        >
          {info.emoji}
        </span>
      )}

      {showQuote && (
        <p className="mt-3 text-xs text-center font-medium italic text-muted-foreground max-w-xs">
          {info.quote}
        </p>
      )}
    </div>
  );
}
