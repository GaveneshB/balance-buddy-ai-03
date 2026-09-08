// Ambient Sound Engine using the Web Audio API
// Provides Brown Noise, Rain, Binaural Alpha Beats, and Celebration Chimes without external files.

export type SoundscapeType = "off" | "brown" | "rain" | "binaural";

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSource: AudioNode | null = null;
  private currentSoundscape: SoundscapeType = "off";
  private brownBuffer: AudioBuffer | null = null;
  private pinkBuffer: AudioBuffer | null = null;
  private binauralOscs: OscillatorNode[] = [];
  private volume: number = 0.5;

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Generates 5 seconds of looped brown noise (Brownian motion)
  private getBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.brownBuffer) return this.brownBuffer;
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5; // Gain compensation
    }

    this.brownBuffer = buffer;
    return buffer;
  }

  // Generates 5 seconds of looped pink noise for rain soundscape
  private getPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.pinkBuffer) return this.pinkBuffer;
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.pinkBuffer = buffer;
    return buffer;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentSoundscape(): SoundscapeType {
    return this.currentSoundscape;
  }

  private stopCurrent() {
    if (this.currentSource) {
      try {
        if ("stop" in this.currentSource && typeof (this.currentSource as AudioScheduledSourceNode).stop === "function") {
          (this.currentSource as AudioScheduledSourceNode).stop();
        }
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }

    this.binauralOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.binauralOscs = [];
  }

  public playSoundscape(type: SoundscapeType) {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.stopCurrent();
    this.currentSoundscape = type;

    if (type === "off") {
      return;
    }

    if (type === "brown") {
      const buffer = this.getBrownNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Low-pass filter for deeper soothing rumble
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      source.connect(filter);
      filter.connect(this.masterGain);
      source.start(0);
      this.currentSource = source;
      return;
    }

    if (type === "rain") {
      const buffer = this.getPinkNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Bandpass filter centered at 850Hz to simulate steady rain on glass
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(850, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.7, ctx.currentTime);

      source.connect(bandpass);
      bandpass.connect(this.masterGain);
      source.start(0);
      this.currentSource = source;
      return;
    }

    if (type === "binaural") {
      // 432Hz Calm Alpha Beat (10Hz difference for alpha focus)
      const rootFreq = 216; // A3 harmonic
      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();

      leftOsc.type = "sine";
      leftOsc.frequency.setValueAtTime(rootFreq, ctx.currentTime);

      rightOsc.type = "sine";
      rightOsc.frequency.setValueAtTime(rootFreq + 10, ctx.currentTime); // 10Hz Alpha pulse

      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(rootFreq / 2, ctx.currentTime); // Deep warm base

      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.25, ctx.currentTime);

      leftOsc.connect(toneGain);
      rightOsc.connect(toneGain);
      subOsc.connect(toneGain);
      toneGain.connect(this.masterGain);

      leftOsc.start(0);
      rightOsc.start(0);
      subOsc.start(0);

      this.binauralOscs = [leftOsc, rightOsc, subOsc];
      this.currentSource = toneGain;
      return;
    }
  }

  // Cheerful, gentle 2-tone bell chime for checking off micro-steps
  public playCelebrationChime() {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: now },       // C5
      { freq: 659.25, time: now + 0.12 }, // E5
      { freq: 783.99, time: now + 0.24 }, // G5
    ];

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      // Bell decay envelope
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.35 * this.volume, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.8);
    });
  }
}

export const ambientAudio = new AmbientSoundEngine();
