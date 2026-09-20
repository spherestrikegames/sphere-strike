// Synthesized Web Audio Core Engine
export class FortniteSoundSystemCore {
  protected ctx: AudioContext | null = null;
  protected isMuted: boolean = false;
  protected isMusicMuted: boolean = false;
  protected masterVolume: number = 0.85;
  protected musicVolume: number = 0.5;
  protected sfxVolume: number = 0.9;
  protected hitVolume: number = 1.0;

  protected currentMusicState: 'none' | 'lobby' | 'game' = 'none';
  protected musicIntervalId: number | null = null;
  protected masterGainNode: GainNode | null = null;
  protected musicGainNode: GainNode | null = null;
  protected sfxGainNode: GainNode | null = null;
  protected hitGainNode: GainNode | null = null;

  protected chestOsc: OscillatorNode | null = null;
  protected chestGain: GainNode | null = null;

  protected noiseBufferCache: Map<number, AudioBuffer> = new Map();

  constructor() {}

  public initCtx() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGainNode.connect(this.ctx.destination);

      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.value = this.sfxVolume;
      this.sfxGainNode.connect(this.masterGainNode);

      this.hitGainNode = this.ctx.createGain();
      this.hitGainNode.gain.value = this.hitVolume;
      this.hitGainNode.connect(this.masterGainNode);

      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.value = this.isMusicMuted ? 0 : this.musicVolume;
      this.musicGainNode.connect(this.masterGainNode);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = muted ? 0 : this.masterVolume;
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGainNode && !this.isMuted) {
      this.masterGainNode.gain.value = this.masterVolume;
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.sfxVolume;
    }
  }

  public setHitSoundVolume(vol: number) {
    this.hitVolume = Math.max(0, Math.min(1, vol));
    if (this.hitGainNode) {
      this.hitGainNode.gain.value = this.hitVolume;
    }
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = muted ? 0 : this.musicVolume;
    }
  }

  public toggleMusic(): boolean {
    this.setMusicMuted(!this.isMusicMuted);
    return !this.isMusicMuted;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGainNode && !this.isMusicMuted) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }

  public applySettings(settings: {
    volume?: number;
    sfxVolume?: number;
    musicVolume?: number;
    hitSoundVolume?: number;
  }) {
    if (settings.volume !== undefined) this.setMasterVolume(settings.volume);
    if (settings.sfxVolume !== undefined) this.setSfxVolume(settings.sfxVolume);
    if (settings.musicVolume !== undefined) this.setMusicVolume(settings.musicVolume);
    if (settings.hitSoundVolume !== undefined) this.setHitSoundVolume(settings.hitSoundVolume);
  }

  protected getDistortionCurve(amount: number = 18): Float32Array {
    const n = 512;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  protected createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.ctx) {
      this.initCtx();
    }
    const bucket = Math.max(0.02, Math.round(duration * 50) / 50);
    const cached = this.noiseBufferCache.get(bucket);
    if (cached) {
      return cached;
    }

    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const bufferSize = Math.max(1, Math.floor(sampleRate * bucket));
    const buffer = this.ctx!.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBufferCache.set(bucket, buffer);
    return buffer;
  }
}
