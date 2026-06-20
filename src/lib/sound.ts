type SoundKind = "start" | "stop" | "exact" | "exactSSR" | "near" | "miss" | "tick";

const STORAGE_KEY = "byou-trivia-sound";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private bgmNodes: { stop: () => void }[] = [];
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private bgmBeatInterval: ReturnType<typeof setInterval> | null = null;
  private muted = false;
  private bgmOn = true;
  private lastTick = 0;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { muted, bgmOn } = JSON.parse(saved);
          this.muted = !!muted;
          this.bgmOn = bgmOn !== false;
        } catch {
          /* ignore */
        }
      }
    }
  }

  private save() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted: this.muted, bgmOn: this.bgmOn }));
    }
  }

  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  private applyVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.bgmGain) return;
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.sfxGain.gain.value = 0.55;
    this.bgmGain.gain.value = this.bgmOn ? 0.22 : 0;
  }

  get isMuted() {
    return this.muted;
  }

  get isBgmOn() {
    return this.bgmOn;
  }

  toggleMute() {
    this.muted = !this.muted;
    this.applyVolumes();
    this.save();
    return this.muted;
  }

  toggleBgm() {
    this.bgmOn = !this.bgmOn;
    this.applyVolumes();
    if (this.bgmOn && !this.muted) this.startBgm();
    else this.stopBgm();
    this.save();
    return this.bgmOn;
  }

  init() {
    this.ensureCtx();
    if (this.bgmOn && !this.muted) this.startBgm();
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.2,
    delay = 0,
    pitchEnd?: number
  ) {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (pitchEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(pitchEnd, 1), t + duration);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private chord(
    freqs: number[],
    duration: number,
    type: OscillatorType = "sawtooth",
    volume = 0.12,
    delay = 0
  ) {
    freqs.forEach((f) => this.tone(f, duration, type, volume / freqs.length, delay));
  }

  private noiseBurst(
    duration: number,
    volume = 0.15,
    delay = 0,
    freq = 800,
    target?: GainNode | null
  ) {
    const out = target ?? this.sfxGain;
    if (this.muted || !this.ctx || !out) return;
    const t = this.ctx.currentTime + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(out);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  private sweep(start: number, end: number, duration: number, volume = 0.2, delay = 0) {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(start, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(end, 1), t + duration);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(8000, t + duration * 0.6);
    filter.frequency.exponentialRampToValueAtTime(600, t + duration);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + duration * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private arpeggio(notes: number[], noteLen: number, type: OscillatorType, volume: number, delay = 0) {
    notes.forEach((f, i) => this.tone(f, noteLen * 0.9, type, volume, delay + i * noteLen));
  }

  startBgm() {
    this.ensureCtx();
    if (!this.ctx || !this.bgmGain || this.bgmNodes.length > 0) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // シンセベース（Aマイナー）
    const bassNotes = [110, 110, 130.81, 110, 146.83, 130.81, 110, 98];
    let bassStep = 0;

    const playBass = () => {
      if (!this.ctx || this.muted || !this.bgmOn) return;
      const t = ctx.currentTime;
      const freq = bassNotes[bassStep % bassNotes.length];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = 320;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.bgmGain!);
      osc.start(t);
      osc.stop(t + 0.25);
      bassStep++;
    };

    // パッド（ルート5和音）
    const padFreqs = [220, 261.63, 329.63];
    padFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = "triangle";
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = 600;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.035, now + 1.5);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.bgmGain!);
      osc.start(now);
      this.bgmNodes.push({
        stop: () => {
          try {
            g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.35);
          } catch {
            /* already stopped */
          }
        },
      });
    });

    // リードメロディ（Amペンタトニック）
    const melody = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392, 440, 523.25, 659.25, 783.99];
    let melStep = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.ctx || this.muted || !this.bgmOn) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      o.type = "square";
      o.frequency.value = melody[melStep % melody.length];
      filter.type = "lowpass";
      filter.frequency.value = 2400;
      filter.Q.value = 2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(filter);
      filter.connect(g);
      g.connect(this.bgmGain!);
      o.start(t);
      o.stop(t + 0.32);
      melStep++;
    }, 280);

    // キック＋ハイハット風ビート
    this.bgmBeatInterval = setInterval(() => {
      playBass();
      if (!this.ctx || this.muted || !this.bgmOn) return;
      const beat = bassStep % 4;
      if (beat === 0 || beat === 2) {
        this.noiseBurst(0.08, 0.18, 0, 120, this.bgmGain);
      }
      if (beat === 1 || beat === 3) {
        this.noiseBurst(0.04, 0.06, 0, 6000, this.bgmGain);
      }
    }, 280);
  }

  stopBgm() {
    this.bgmNodes.forEach((n) => n.stop());
    this.bgmNodes = [];
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmBeatInterval) {
      clearInterval(this.bgmBeatInterval);
      this.bgmBeatInterval = null;
    }
  }

  play(kind: SoundKind) {
    this.ensureCtx();
    if (this.muted) return;

    switch (kind) {
      case "start":
        this.sweep(180, 880, 0.35, 0.22);
        this.tone(660, 0.1, "square", 0.18, 0.2);
        this.tone(880, 0.15, "square", 0.2, 0.28);
        this.chord([440, 554.37, 659.25], 0.2, "sawtooth", 0.2, 0.32);
        this.noiseBurst(0.06, 0.12, 0.3, 2000);
        break;

      case "stop":
        this.noiseBurst(0.05, 0.2, 0, 300);
        this.tone(880, 0.08, "square", 0.25);
        this.tone(440, 0.12, "sawtooth", 0.2, 0.05);
        this.sweep(1200, 200, 0.25, 0.18, 0.08);
        this.chord([329.63, 392, 493.88], 0.3, "triangle", 0.18, 0.12);
        break;

      case "tick":
        if (Date.now() - this.lastTick < 70) return;
        this.lastTick = Date.now();
        this.tone(1800 + Math.random() * 200, 0.025, "square", 0.05);
        this.noiseBurst(0.015, 0.03, 0, 4000);
        break;

      case "exact":
        this.arpeggio([523.25, 659.25, 783.99, 1046.5], 0.07, "square", 0.18);
        this.chord([523.25, 659.25, 783.99], 0.35, "sawtooth", 0.22, 0.28);
        this.sweep(400, 1600, 0.2, 0.12, 0.3);
        break;

      case "exactSSR":
        // ファンファーレ
        this.sweep(200, 1200, 0.5, 0.28);
        this.noiseBurst(0.1, 0.25, 0.05, 400);
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          this.tone(f, 0.25, "sawtooth", 0.2, i * 0.1)
        );
        this.chord([1046.5, 1318.5, 1568], 0.5, "square", 0.25, 0.45);
        this.arpeggio([1568, 1975.5, 2349.3, 2637, 3136], 0.06, "square", 0.14, 0.55);
        this.chord([523.25, 659.25, 783.99, 1046.5], 0.6, "sawtooth", 0.2, 0.75);
        this.sweep(2000, 400, 0.4, 0.15, 0.9);
        break;

      case "near":
        this.tone(587.33, 0.1, "triangle", 0.16);
        this.tone(659.25, 0.12, "triangle", 0.18, 0.1);
        this.arpeggio([698.46, 783.99, 880], 0.08, "sine", 0.14, 0.18);
        this.sweep(800, 1200, 0.15, 0.1, 0.35);
        break;

      case "miss":
        this.tone(220, 0.15, "sawtooth", 0.14);
        this.tone(185, 0.2, "sawtooth", 0.12, 0.12, 140);
        this.sweep(300, 80, 0.35, 0.12, 0.2);
        this.noiseBurst(0.12, 0.1, 0.25, 200);
        break;
    }
  }
}

export const soundEngine = typeof window !== "undefined" ? new SoundEngine() : null;

export function playResultSound(matchType: string, rarity?: string) {
  if (!soundEngine) return;
  if (matchType === "exact") {
    soundEngine.play(rarity === "SSR" ? "exactSSR" : "exact");
  } else if (matchType === "near") {
    soundEngine.play("near");
  } else {
    soundEngine.play("miss");
  }
}
