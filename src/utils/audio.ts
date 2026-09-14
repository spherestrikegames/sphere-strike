// Synthesized Web Audio Engine for Authentic Fortnite Sounds & Background Music
class FortniteSoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private masterVolume: number = 0.85;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.9;
  private hitVolume: number = 1.0;

  // Background Music Timers & Nodes
  private currentMusicState: 'none' | 'lobby' | 'game' = 'none';
  private musicIntervalId: number | null = null;
  private masterGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private hitGainNode: GainNode | null = null;

  // Chest Hum Loop
  private chestOsc: OscillatorNode | null = null;
  private chestGain: GainNode | null = null;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master Gain -> Destination
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGainNode.connect(this.ctx.destination);

      // SFX Gain -> Master Gain
      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.value = this.sfxVolume;
      this.sfxGainNode.connect(this.masterGainNode);

      // Hit & Elim Gain -> Master Gain
      this.hitGainNode = this.ctx.createGain();
      this.hitGainNode.gain.value = this.hitVolume;
      this.hitGainNode.connect(this.masterGainNode);

      // Music Gain -> Master Gain
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
    if (!muted && this.currentMusicState === 'none') {
      this.startLobbyMusic();
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

  // --- BACKGROUND MUSIC ENGINE (2v2.io DYNAMIC BATTLE STYLE) ---

  // --- BACKGROUND MUSIC ENGINE (AUTHENTIC 2v2.io HIGH-OCTANE BATTLE & LOBBY TRACKS) ---

  // Soft saturation distortion curve generator for authentic 808 saturation
  private getDistortionCurve(amount: number = 18): Float32Array {
    const n = 512;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  public startLobbyMusic() {
    this.initCtx();
    if (this.currentMusicState === 'lobby') return;
    this.stopMusic();
    this.currentMusicState = 'lobby';

    // Stylish 2v2.io Lobby Vibe: 128 BPM Chill-Trap Future Bass (Warm 7th Chords, Bouncy Sub, Bell Arps)
    const bpm = 128;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;

    const chords = [
      { root: 220.0, bass: 55.0, notes: [220, 261.63, 329.63, 392.0] }, // Am7
      { root: 174.61, bass: 43.65, notes: [174.61, 220.0, 261.63, 329.63] }, // Fmaj7
      { root: 261.63, bass: 65.41, notes: [261.63, 329.63, 392.0, 493.88] }, // Cmaj7
      { root: 196.0, bass: 49.0, notes: [196.0, 246.94, 293.66, 349.23] }, // G7
    ];

    let chordIdx = 0;

    const playLobbyBar = () => {
      if (this.currentMusicState !== 'lobby' || !this.ctx || this.isMusicMuted || !this.musicGainNode) return;
      const t = this.ctx.currentTime;
      const curr = chords[chordIdx % chords.length];
      chordIdx++;

      // 1. Lush Future-Bass Pad Chords (Detuned Stereo Sawtooths with Lowpass Sweeps)
      curr.notes.forEach((f) => {
        if (!this.ctx || !this.musicGainNode) return;
        [-6, 6].forEach((detune) => {
          const osc = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, t);
          osc.detune.setValueAtTime(detune, t);

          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, t);
          filter.frequency.exponentialRampToValueAtTime(600, t + barSec * 0.9);

          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.045, t + 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, t + barSec - 0.05);

          osc.connect(filter);
          filter.connect(g);
          g.connect(this.musicGainNode!);

          osc.start(t);
          osc.stop(t + barSec);
        });
      });

      // 2. Smooth Sub-Bass (Syncopated Bouncy Beats)
      [0, 1.5, 2.75].forEach((beatOffset) => {
        if (!this.ctx || !this.musicGainNode) return;
        const bt = t + beatOffset * beatSec;
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(curr.bass * 1.3, bt);
        bOsc.frequency.exponentialRampToValueAtTime(curr.bass, bt + 0.08);

        bGain.gain.setValueAtTime(0.24, bt);
        bGain.gain.exponentialRampToValueAtTime(0.01, bt + beatSec * 1.1);

        bOsc.connect(bGain);
        bGain.connect(this.musicGainNode);
        bOsc.start(bt);
        bOsc.stop(bt + beatSec * 1.2);
      });

      // 3. Crisp Trap Shaker / Hi-Hats
      for (let i = 0; i < 8; i++) {
        const ht = t + i * (beatSec / 2);
        const nNode = this.ctx.createBufferSource();
        nNode.buffer = this.createNoiseBuffer(0.03);
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'highpass';
        nFilter.frequency.setValueAtTime(7500, ht);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(i % 2 === 1 ? 0.06 : 0.03, ht);
        nGain.gain.exponentialRampToValueAtTime(0.001, ht + 0.03);
        nNode.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.musicGainNode);
        nNode.start(ht);
      }

      // 4. Sparkling Bell Arpeggio
      const bellPitches = [curr.notes[1] * 2, curr.notes[3] * 2, curr.notes[2] * 2, curr.notes[0] * 4];
      bellPitches.forEach((bp, bi) => {
        if (!this.ctx || !this.musicGainNode) return;
        const lt = t + (bi + 0.5) * (beatSec * 0.85);
        const lOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        lOsc.type = 'sine';
        lOsc.frequency.setValueAtTime(bp, lt);

        lGain.gain.setValueAtTime(0.08, lt);
        lGain.gain.exponentialRampToValueAtTime(0.002, lt + 0.4);

        lOsc.connect(lGain);
        lGain.connect(this.musicGainNode);
        lOsc.start(lt);
        lOsc.stop(lt + 0.42);
      });
    };

    playLobbyBar();
    this.musicIntervalId = window.setInterval(playLobbyBar, barSec * 1000);
  }

  public startGameMusic() {
    this.initCtx();
    if (this.currentMusicState === 'game') return;
    this.stopMusic();
    this.currentMusicState = 'game';

    // 2v2.io Authentic Arena Battle Beat:
    // Driving 148 BPM, Heavy Saturated 808 Sub-Bass with Pitch Glides, Dual-Stage Kicks,
    // Sidechain Synth Pumping, Layered Claps, Accelerating Drum Rolls, and Aggressive Hook Melodies
    const bpm = 148;
    const beatSec = 60 / bpm; // ~0.405s per beat
    const barSec = beatSec * 4; // ~1.621s per bar

    // 4-Bar Harmonic Progression (F minor -> Db major -> Ab major -> Eb major)
    const progression = [
      { bassFreq: 43.65, chordNotes: [349.23, 415.3, 523.25, 698.46] }, // Fm
      { bassFreq: 34.65, chordNotes: [277.18, 349.23, 415.3, 554.37] }, // Db
      { bassFreq: 51.91, chordNotes: [415.3, 523.25, 622.25, 830.61] }, // Ab
      { bassFreq: 38.89, chordNotes: [311.13, 392.0, 466.16, 622.25] }, // Eb
    ];

    let barCounter = 0;

    const play2v2BeatBar = () => {
      if (this.currentMusicState !== 'game' || !this.ctx || this.isMusicMuted || !this.musicGainNode) return;
      const t = this.ctx.currentTime;
      const barIndex = barCounter % 8;
      const stepProg = progression[barCounter % progression.length];
      barCounter++;

      const isSlideBar = barIndex === 3 || barIndex === 7;
      const isBuildBar = barIndex === 7;

      // Master Sidechain Ducking Node for the Synth Bus
      const synthSidechainGain = this.ctx.createGain();
      synthSidechainGain.gain.setValueAtTime(1.0, t);
      synthSidechainGain.connect(this.musicGainNode);

      // 1. Heavy Saturated 808 Sub-Bass with Sub-Harmonics & Pitch Glide
      const bassOsc = this.ctx.createOscillator();
      const bassDrive = this.ctx.createWaveShaper();
      bassDrive.curve = this.getDistortionCurve(16) as any;
      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(280, t);
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'sine';
      // Initial punch pitch drop: quick pitch fall from high transient into deep sub rumble
      bassOsc.frequency.setValueAtTime(stepProg.bassFreq * 1.8, t);
      bassOsc.frequency.exponentialRampToValueAtTime(stepProg.bassFreq, t + 0.05);

      // Authentic 2v2.io 808 Pitch Slide up an octave or fifth
      if (isSlideBar) {
        bassOsc.frequency.setValueAtTime(stepProg.bassFreq, t + beatSec * 2.0);
        bassOsc.frequency.exponentialRampToValueAtTime(stepProg.bassFreq * 2.0, t + beatSec * 3.2);
        bassOsc.frequency.linearRampToValueAtTime(stepProg.bassFreq, t + beatSec * 3.8);
      }

      bassGain.gain.setValueAtTime(0.42, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + barSec - 0.04);

      bassOsc.connect(bassDrive);
      bassDrive.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGainNode);
      bassOsc.start(t);
      bassOsc.stop(t + barSec);

      // 2. Punchy Dual-Stage Kick Drums + Dynamic Sidechain Ducking
      const kickBeats = isBuildBar
        ? [0, 0.75, 1.5, 2.0, 2.5, 3.0, 3.5]
        : isSlideBar
        ? [0, 1.75, 2.5, 3.25]
        : [0, 2.0, 3.25];

      kickBeats.forEach((kb) => {
        if (!this.ctx || !this.musicGainNode) return;
        const kt = t + kb * beatSec;

        // Sidechain ducking on the synth bus for that authentic modern trap punch
        synthSidechainGain.gain.setValueAtTime(0.25, kt);
        synthSidechainGain.gain.exponentialRampToValueAtTime(1.0, kt + 0.16);

        // Low-end Sub Boom
        const kOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kOsc.type = 'sine';
        kOsc.frequency.setValueAtTime(155, kt);
        kOsc.frequency.exponentialRampToValueAtTime(42, kt + 0.09);
        kGain.gain.setValueAtTime(0.48, kt);
        kGain.gain.exponentialRampToValueAtTime(0.005, kt + 0.19);
        kOsc.connect(kGain);
        kGain.connect(this.musicGainNode);
        kOsc.start(kt);
        kOsc.stop(kt + 0.2);

        // High transient click
        const clickNoise = this.ctx.createBufferSource();
        clickNoise.buffer = this.createNoiseBuffer(0.012);
        const clickFilter = this.ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(2400, kt);
        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0.18, kt);
        clickGain.gain.exponentialRampToValueAtTime(0.001, kt + 0.012);
        clickNoise.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.musicGainNode);
        clickNoise.start(kt);
      });

      // 3. Layered Trap Claps / Snares (Beats 2 and 4, plus build-up roll on bar 8)
      const snareBeats = isBuildBar
        ? [1.0, 1.5, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75]
        : [1.0, 3.0];

      snareBeats.forEach((sb, sIdx) => {
        if (!this.ctx || !this.musicGainNode) return;
        const st = t + sb * beatSec;
        const volMult = isBuildBar ? Math.min(1.0, 0.4 + (sIdx / snareBeats.length) * 0.6) : 1.0;

        // Snare Noise Body & Multi-Tap Clap effect
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.15);
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.setValueAtTime(1900, st);
        nFilter.Q.value = 1.4;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.32 * volMult, st);
        nGain.gain.exponentialRampToValueAtTime(0.005, st + 0.14);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.musicGainNode);
        noise.start(st);

        // Snare Tone Smack (Crisp Acoustic Crack)
        const sTone = this.ctx.createOscillator();
        const sToneG = this.ctx.createGain();
        sTone.type = 'triangle';
        sTone.frequency.setValueAtTime(260, st);
        sTone.frequency.exponentialRampToValueAtTime(120, st + 0.06);
        sToneG.gain.setValueAtTime(0.24 * volMult, st);
        sToneG.gain.exponentialRampToValueAtTime(0.01, st + 0.07);

        sTone.connect(sToneG);
        sToneG.connect(this.musicGainNode);
        sTone.start(st);
        sTone.stop(st + 0.08);
      });

      // 4. Rolling 16th-Note & 32nd-Note Trap Hi-Hats with Velocity Swings & Triplet Rolls
      const hatDivisions = isBuildBar ? 32 : 16;
      for (let h = 0; h < hatDivisions; h++) {
        const ht = t + (h * barSec) / hatDivisions;
        const hNoise = this.ctx.createBufferSource();
        hNoise.buffer = this.createNoiseBuffer(0.03);
        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(h % 4 === 0 ? 8500 : 10000, ht);

        const hGain = this.ctx.createGain();
        // Dynamic velocity swinging
        let vel = h % 4 === 0 ? 0.1 : h % 2 === 0 ? 0.065 : 0.04;
        if (h >= 12 && (barIndex === 1 || barIndex === 3 || barIndex === 5)) {
          vel = 0.09; // Triple burst roll
        }
        hGain.gain.setValueAtTime(vel, ht);
        hGain.gain.exponentialRampToValueAtTime(0.001, ht + 0.028);

        hNoise.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.musicGainNode);
        hNoise.start(ht);
      }

      // Open Hi-Hat on offbeats for classic energetic bounce
      if (!isBuildBar) {
        [0.5, 2.5].forEach((ohb) => {
          if (!this.ctx || !this.musicGainNode) return;
          const oht = t + ohb * beatSec;
          const ohNoise = this.ctx.createBufferSource();
          ohNoise.buffer = this.createNoiseBuffer(0.18);
          const ohFilter = this.ctx.createBiquadFilter();
          ohFilter.type = 'highpass';
          ohFilter.frequency.setValueAtTime(7000, oht);
          const ohGain = this.ctx.createGain();
          ohGain.gain.setValueAtTime(0.07, oht);
          ohGain.gain.exponentialRampToValueAtTime(0.002, oht + 0.16);
          ohNoise.connect(ohFilter);
          ohFilter.connect(ohGain);
          ohGain.connect(this.musicGainNode);
          ohNoise.start(oht);
        });
      }

      // 5. Energetic Detuned Supersaw Chords (Connected to Sidechain Bus)
      const chordRhythm = [0, 0.75, 2.0, 2.75, 3.5];
      chordRhythm.forEach((cr) => {
        if (!this.ctx) return;
        const ct = t + cr * beatSec;
        stepProg.chordNotes.slice(0, 3).forEach((cf) => {
          [-8, 8].forEach((detuneVal) => {
            const cOsc = this.ctx!.createOscillator();
            const cGain = this.ctx!.createGain();
            cOsc.type = 'sawtooth';
            cOsc.frequency.setValueAtTime(cf, ct);
            cOsc.detune.setValueAtTime(detuneVal, ct);

            const cFilter = this.ctx!.createBiquadFilter();
            cFilter.type = 'lowpass';
            cFilter.frequency.setValueAtTime(2800, ct);
            cFilter.frequency.exponentialRampToValueAtTime(900, ct + 0.22);

            cGain.gain.setValueAtTime(0.045, ct);
            cGain.gain.exponentialRampToValueAtTime(0.002, ct + 0.24);

            cOsc.connect(cFilter);
            cFilter.connect(cGain);
            cGain.connect(synthSidechainGain);
            cOsc.start(ct);
            cOsc.stop(ct + 0.26);
          });
        });
      });

      // 6. Catchy 2v2.io Arena Lead Hook (Piercing Searing Lead with Fast Decay)
      const leadNotes = barIndex % 2 === 0
        ? [
            { note: stepProg.chordNotes[0], beat: 0 },
            { note: stepProg.chordNotes[1], beat: 0.5 },
            { note: stepProg.chordNotes[2], beat: 1.25 },
            { note: stepProg.chordNotes[3], beat: 2.0 },
            { note: stepProg.chordNotes[2], beat: 2.75 },
            { note: stepProg.chordNotes[1], beat: 3.25 },
          ]
        : [
            { note: stepProg.chordNotes[2], beat: 0 },
            { note: stepProg.chordNotes[3], beat: 0.75 },
            { note: stepProg.chordNotes[1], beat: 1.5 },
            { note: stepProg.chordNotes[2], beat: 2.25 },
            { note: stepProg.chordNotes[0], beat: 3.0 },
            { note: stepProg.chordNotes[1], beat: 3.5 },
          ];

      leadNotes.forEach((m) => {
        if (!this.ctx) return;
        const mt = t + m.beat * beatSec;
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'triangle';
        mOsc.frequency.setValueAtTime(m.note * 2.0, mt);

        const mFilter = this.ctx.createBiquadFilter();
        mFilter.type = 'lowpass';
        mFilter.frequency.setValueAtTime(3600, mt);
        mFilter.frequency.exponentialRampToValueAtTime(1100, mt + 0.2);

        mGain.gain.setValueAtTime(0.12, mt);
        mGain.gain.exponentialRampToValueAtTime(0.005, mt + 0.24);

        mOsc.connect(mFilter);
        mFilter.connect(mGain);
        mGain.connect(synthSidechainGain);
        mOsc.start(mt);
        mOsc.stop(mt + 0.26);
      });
    };

    play2v2BeatBar();
    this.musicIntervalId = window.setInterval(play2v2BeatBar, barSec * 1000);
  }

  public stopMusic() {
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.currentMusicState = 'none';
  }

  // --- REALISTIC FOOTSTEPS ---

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
      // Metal
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

  // --- WEAPON SOUNDS ---

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

    // Realistic tactile shotgun pump slide after blast
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

    // Mechanical bolt-action chambering sound
    setTimeout(() => {
      this.playSniperBoltAction();
    }, 450);
  }

  public playSniperBoltAction() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    // Bolt lift & slide
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

    // Bolt lock forward
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
    // Rocket swoosh / booster hiss + launch thump
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
    // Deep thunderous anti-material rifle roar
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

  public playUpgradeBenchAnvil() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;
    // Crisp metallic anvil strike with golden harmonic sparkle
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
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
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

    // Mag eject click
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

    // Mag insert snap
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

  // --- HARVESTING & BUILDING ---

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

  // --- COMBAT & SHIELD SOUNDS ---

  public playHitmarker(isHeadshot: boolean, isShield: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGainNode) return;

    const t = this.ctx.currentTime;

    if (isHeadshot) {
      // Crisp metallic ding + high chime
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
      // Shield crack / electric glass chime
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
      // Flesh thud
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

    // Deep Thunder Clap
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

    // 1. Deep sub bass impact punch
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

    // 2. High-energy celebratory synthesizer chord
    const fanfareNotes = isHeadshot
      ? [587.33, 739.99, 880.0, 1174.66, 1479.98] // D Major 9th Headshot
      : [440.0, 554.37, 659.25, 880.0, 1108.73]; // A Major 7th

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

    // 3. Shimmering reward bell
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
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
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

  public playGunshotPump(isSilenced: boolean = false) {
    this.playGunshotShotgun();
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.ctx) {
      this.initCtx();
    }
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx!.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const fortniteAudio = new FortniteSoundSystem();
