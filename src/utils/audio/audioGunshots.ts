import { FortniteSoundSystemCore } from './audioCore';

export class FortniteGunshotsEngine extends FortniteSoundSystemCore {
  public playGunshotAR(isLegendary: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer(0.14);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLegendary ? 4200 : 3200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.type = isLegendary ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isLegendary ? 150 : 190, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);

    noiseNode.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playGunshotBurstRifle(roundIndex: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer(0.08);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = roundIndex === 1 ? 3800 : roundIndex === 2 ? 4200 : 4700;
    filter.frequency.setValueAtTime(baseFreq, t);
    filter.Q.setValueAtTime(3.5, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + 0.075);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(roundIndex === 3 ? 0.75 : 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.type = 'sawtooth';
    const startFreq = roundIndex === 1 ? 290 : roundIndex === 2 ? 340 : 420;
    const endFreq = roundIndex === 3 ? 95 : 75;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.065);

    noiseNode.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playGunshotBurst() {
    this.playGunshotBurstRifle(1);
    setTimeout(() => this.playGunshotBurstRifle(2), 60);
    setTimeout(() => this.playGunshotBurstRifle(3), 120);
  }

  public playGunshotShotgun() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.24);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.2);

    noiseNode.connect(filter);
    filter.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    subOsc.start(t);
    subOsc.stop(t + 0.24);

    setTimeout(() => {
      this.playShotgunPump();
    }, 280);
  }

  public playShotgunPump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const pt = this.ctx.currentTime;
    const pOsc = this.ctx.createOscillator();
    const pGain = this.ctx.createGain();
    pOsc.type = 'sawtooth';
    pOsc.frequency.setValueAtTime(280, pt);
    pOsc.frequency.setValueAtTime(580, pt + 0.06);
    pGain.gain.setValueAtTime(0.2, pt);
    pGain.gain.exponentialRampToValueAtTime(0.01, pt + 0.12);
    pOsc.connect(pGain);
    pGain.connect(this.masterGainNode);
    pOsc.start(pt);
    pOsc.stop(pt + 0.12);
  }

  public playGunshotPump(isSilenced: boolean = false) {
    this.playGunshotShotgun();
  }

  public playGunshotSniper() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.45);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.95, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    const sub = this.ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(100, t);
    sub.frequency.exponentialRampToValueAtTime(20, t + 0.3);

    noiseNode.connect(filter);
    filter.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    sub.start(t);
    sub.stop(t + 0.45);

    setTimeout(() => {
      this.playSniperBoltAction();
    }, 450);
  }

  public playSniperBoltAction() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(600, t);
    osc1.frequency.setValueAtTime(900, t + 0.08);
    g1.gain.setValueAtTime(0.2, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc1.connect(g1);
    g1.connect(this.masterGainNode);
    osc1.start(t);
    osc1.stop(t + 0.16);

    setTimeout(() => {
      if (!this.ctx || !this.masterGainNode) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(450, t2);
      osc2.frequency.setValueAtTime(200, t2 + 0.07);
      g2.gain.setValueAtTime(0.25, t2);
      g2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.12);
      osc2.connect(g2);
      g2.connect(this.masterGainNode);
      osc2.start(t2);
      osc2.stop(t2 + 0.13);
    }, 240);
  }

  public playGunshotSMG() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playGunshotDrumGun() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    const noise = this.createNoiseBuffer(0.08);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);

    noiseNode.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playGunshotMinigun() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playGunshotRPG() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.35);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    noiseNode.connect(filter);
    filter.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    sub.start(t);
    sub.stop(t + 0.35);
  }

  public playExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.65);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

    const sub = this.ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(20, t + 0.5);

    noiseNode.connect(filter);
    filter.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    sub.start(t);
    sub.stop(t + 0.65);
  }

  public playGunshotHeavySniper() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.6);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, t);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    const sub = this.ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(95, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.4);

    noiseNode.connect(filter);
    filter.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    sub.start(t);
    sub.stop(t + 0.6);
  }

  public playGunshotFlintKnock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.35);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(180, t);
    sub.frequency.exponentialRampToValueAtTime(45, t + 0.25);

    noiseNode.connect(filter);
    filter.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    sub.start(t);
    sub.stop(t + 0.35);
  }

  public playGunshotDoubleBarrel() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.35);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + 0.32);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(190, t);
    subOsc.frequency.exponentialRampToValueAtTime(24, t + 0.3);

    noiseNode.connect(filter);
    filter.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    subOsc.start(t);
    subOsc.stop(t + 0.35);
  }
}
