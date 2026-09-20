import { FortniteGunshotsEngine } from './audioGunshots';

export class FortniteGameplayAudioEngine extends FortniteGunshotsEngine {
  public playFootstep(surface: 'grass' | 'wood' | 'stone' | 'metal' | 'water' = 'grass') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;

    if (surface === 'water') {
      this.playWaterSplash(0.18);
      return;
    }

    const noise = this.createNoiseBuffer(0.08);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (surface === 'grass') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200 + Math.random() * 300, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    } else if (surface === 'wood') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      filter.Q.value = 3;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
    } else if (surface === 'stone') {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    } else {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, t);
      filter.Q.value = 4;
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    }

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
  }

  public playUpgradeBenchAnvil() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(2800, t + 0.15);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(700, t);
    osc2.frequency.exponentialRampToValueAtTime(2100, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.4);
    osc2.stop(t + 0.4);
  }

  public playBuildResetShockwave() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  public playPurchaseSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t + idx * 0.06);
      g.gain.setValueAtTime(0.4, t + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.18);
      o.connect(g);
      g.connect(this.masterGainNode!);
      o.start(t + idx * 0.06);
      o.stop(t + idx * 0.06 + 0.18);
    });
  }

  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(500, t);
    osc1.frequency.setValueAtTime(800, t + 0.06);
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0.25, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc1.connect(g1);
    g1.connect(this.masterGainNode);
    osc1.start(t);
    osc1.stop(t + 0.12);

    setTimeout(() => {
      if (!this.ctx || !this.masterGainNode) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(750, t2);
      osc2.frequency.setValueAtTime(350, t2 + 0.08);
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.3, t2);
      g2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.14);
      osc2.connect(g2);
      g2.connect(this.masterGainNode);
      osc2.start(t2);
      osc2.stop(t2 + 0.14);
    }, 280);
  }

  public playDoubleBarrelReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t1 = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(420, t1);
    osc1.frequency.exponentialRampToValueAtTime(860, t1 + 0.08);
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0.35, t1);
    g1.gain.exponentialRampToValueAtTime(0.01, t1 + 0.14);
    osc1.connect(g1);
    g1.connect(this.masterGainNode);
    osc1.start(t1);
    osc1.stop(t1 + 0.14);

    setTimeout(() => {
      if (!this.ctx || !this.masterGainNode) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(620, t);
      o.frequency.setValueAtTime(320, t + 0.07);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      o.connect(g);
      g.connect(this.masterGainNode);
      o.start(t);
      o.stop(t + 0.12);
    }, 900);

    setTimeout(() => {
      if (!this.ctx || !this.masterGainNode) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(740, t);
      o.frequency.setValueAtTime(360, t + 0.07);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      o.connect(g);
      g.connect(this.masterGainNode);
      o.start(t);
      o.stop(t + 0.12);
    }, 1700);

    setTimeout(() => {
      if (!this.ctx || !this.masterGainNode) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(950, t);
      o.frequency.exponentialRampToValueAtTime(220, t + 0.12);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      o.connect(g);
      g.connect(this.masterGainNode);
      o.start(t);
      o.stop(t + 0.18);
    }, 2500);
  }

  public playPixelDisintegration() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const noteTime = t + idx * 0.035;
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, noteTime);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, noteTime + 0.08);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, noteTime);
      g.gain.exponentialRampToValueAtTime(0.005, noteTime + 0.1);

      osc.connect(g);
      g.connect(this.masterGainNode);
      osc.start(noteTime);
      osc.stop(noteTime + 0.1);
    });

    const noise = this.createNoiseBuffer(0.4);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGainNode);
    noiseNode.start(t);
  }

  public playBulletCrack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.05);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3500, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);
    noiseNode.start(t);
  }

  public playPickaxeSwing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.13);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playHarvestHit(material: 'wood' | 'stone' | 'metal', isCrit: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const baseFreq = material === 'metal' ? 880 : material === 'stone' ? 340 : 200;
    const osc = this.ctx.createOscillator();
    osc.type = material === 'metal' ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(baseFreq * (isCrit ? 1.4 : 1.0), t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isCrit ? 0.65 : 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.12);

    if (isCrit) {
      const ringOsc = this.ctx.createOscillator();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(1500, t);
      ringOsc.frequency.exponentialRampToValueAtTime(2000, t + 0.16);
      const ringGain = this.ctx.createGain();
      ringGain.gain.setValueAtTime(0.4, t);
      ringGain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      ringOsc.connect(ringGain);
      ringGain.connect(this.masterGainNode);
      ringOsc.start(t);
      ringOsc.stop(t + 0.16);
    }
  }

  public playBuildPlace(material: 'wood' | 'stone' | 'metal') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (material === 'wood') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.setValueAtTime(170, t + 0.04);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    } else if (material === 'stone') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.setValueAtTime(120, t + 0.05);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.1);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    }

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playStructureDestroy(material: 'wood' | 'stone' | 'metal') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.2);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(material === 'metal' ? 2400 : 800, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);
    noiseNode.start(t);
  }

  public playHitmarker(isHeadshot: boolean, isShield: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;

    if (isHeadshot) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1860, t);
      osc.frequency.exponentialRampToValueAtTime(2400, t + 0.14);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (isShield) {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(1300, t + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.12);
    } else {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.07);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  public playShieldBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.3);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);
    noiseNode.start(t);
  }

  public playShieldDrink() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.08);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }

  public playChestOpen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const chords = [587.33, 739.99, 880.0, 1174.66];
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.3, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t + idx * 0.05);
      osc.stop(t + 0.6);
    });
  }

  public playWaterSplash(volume: number = 0.4) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.18);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);
    noiseNode.start(t);
  }

  public playStormWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.4);
    osc.frequency.linearRampToValueAtTime(440, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.85);

    setTimeout(() => {
      if (!this.ctx || !this.masterGainNode) return;
      const tt = this.ctx.currentTime;
      const tNoise = this.createNoiseBuffer(0.8);
      const tNode = this.ctx.createBufferSource();
      tNode.buffer = tNoise;
      const tFilter = this.ctx.createBiquadFilter();
      tFilter.type = 'lowpass';
      tFilter.frequency.setValueAtTime(250, tt);
      tFilter.frequency.exponentialRampToValueAtTime(60, tt + 0.8);
      const tGain = this.ctx.createGain();
      tGain.gain.setValueAtTime(0.5, tt);
      tGain.gain.exponentialRampToValueAtTime(0.01, tt + 0.8);
      tNode.connect(tFilter);
      tFilter.connect(tGain);
      tGain.connect(this.masterGainNode);
      tNode.start(tt);
    }, 400);
  }

  public playStormTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playEliminationSound() {
    this.playEliminationFanfare(false);
  }

  public playEliminationFanfare(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.65, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    subOsc.connect(subGain);
    subGain.connect(this.masterGainNode);
    subOsc.start(t);
    subOsc.stop(t + 0.36);

    const fanfareNotes = isHeadshot
      ? [587.33, 739.99, 880.0, 1174.66, 1479.98]
      : [440.0, 554.37, 659.25, 880.0, 1108.73];

    fanfareNotes.forEach((f, i) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.04);

      gain.gain.setValueAtTime(0, t + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.4, t + i * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.005, t + i * 0.04 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.62);
    });

    const bellOsc = this.ctx.createOscillator();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(isHeadshot ? 2349.32 : 1760.0, t + 0.12);
    bellOsc.frequency.exponentialRampToValueAtTime(isHeadshot ? 2793.83 : 2093.0, t + 0.45);
    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.3, t + 0.12);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    bellOsc.connect(bellGain);
    bellGain.connect(this.masterGainNode);
    bellOsc.start(t + 0.12);
    bellOsc.stop(t + 0.56);
  }

  public playXpChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.045);
      gain.gain.setValueAtTime(0.25, t + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.045 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t + i * 0.045);
      osc.stop(t + i * 0.045 + 0.22);
    });
  }

  public playItemCollectSound(type: string = 'material') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq =
      type === 'wood'
        ? 320
        : type === 'stone'
        ? 440
        : type === 'metal'
        ? 680
        : type === 'shield'
        ? 580
        : type === 'weapon'
        ? 750
        : 500;

    osc.type = type === 'metal' || type === 'weapon' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playVictoryRoyale() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 523.25, time: 0, dur: 0.15 },
      { f: 659.25, time: 0.15, dur: 0.15 },
      { f: 783.99, time: 0.3, dur: 0.15 },
      { f: 1046.5, time: 0.45, dur: 0.6 },
      { f: 880.0, time: 1.1, dur: 0.2 },
      { f: 1046.5, time: 1.35, dur: 1.2 },
    ];

    notes.forEach((n) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t + n.time);

      gain.gain.setValueAtTime(0, t + n.time);
      gain.gain.linearRampToValueAtTime(0.45, t + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur);
    });
  }

  public playWindRush() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.2);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
  }

  public playGliderDeploy() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.4);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(2400, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
  }

  public playTouchdown() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    const noise = this.createNoiseBuffer(0.25);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    noiseNode.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.35);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.linearRampToValueAtTime(400, t + 0.35);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
  }

  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playCarEngine(speedRatio: number, isNitro: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = isNitro ? 'sawtooth' : 'triangle';
    const baseFreq = isNitro ? 120 + speedRatio * 180 : 55 + speedRatio * 110;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq + 10, t + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isNitro ? 1800 : 700, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isNitro ? 0.25 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGainNode);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playCarHonk() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    [440, 554.37].forEach((f) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playCarDoor() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    const noise = this.createNoiseBuffer(0.12);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noiseNode.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playNitroBoost() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.25);

    const noise = this.createNoiseBuffer(0.3);
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.value = 2.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    noiseNode.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.masterGainNode);

    noiseNode.start(t);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playSupplyDropSpawn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.masterGainNode) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.1);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.4);
    });
  }

  public playSupplyPickup(type: string = 'weapon') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const startF = type === 'shield' ? 520 : type === 'weapon' ? 660 : 440;
    osc.frequency.setValueAtTime(startF, t);
    osc.frequency.exponentialRampToValueAtTime(startF * 1.6, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playUiClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGainNode);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}
