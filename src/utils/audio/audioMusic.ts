import { FortniteGameplayAudioEngine } from './audioGameplay';

export class FortniteMusicEngine extends FortniteGameplayAudioEngine {
  public startLobbyMusic() {
    this.initCtx();
    if (this.currentMusicState === 'lobby') return;
    this.stopMusic();
    this.currentMusicState = 'lobby';

    const bpm = 128;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;

    const chords = [
      { root: 220.0, bass: 55.0, notes: [220, 261.63, 329.63, 392.0] },
      { root: 174.61, bass: 43.65, notes: [174.61, 220.0, 261.63, 329.63] },
      { root: 261.63, bass: 65.41, notes: [261.63, 329.63, 392.0, 493.88] },
      { root: 196.0, bass: 49.0, notes: [196.0, 246.94, 293.66, 349.23] },
    ];

    let chordIdx = 0;

    const playLobbyBar = () => {
      if (this.currentMusicState !== 'lobby' || !this.ctx || this.isMusicMuted || !this.musicGainNode) return;
      const t = this.ctx.currentTime;
      const curr = chords[chordIdx % chords.length];
      chordIdx++;

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

    const bpm = 148;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;

    const progression = [
      { bassFreq: 43.65, chordNotes: [349.23, 415.3, 523.25, 698.46] },
      { bassFreq: 34.65, chordNotes: [277.18, 349.23, 415.3, 554.37] },
      { bassFreq: 51.91, chordNotes: [415.3, 523.25, 622.25, 830.61] },
      { bassFreq: 38.89, chordNotes: [311.13, 392.0, 466.16, 622.25] },
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

      const synthSidechainGain = this.ctx.createGain();
      synthSidechainGain.gain.setValueAtTime(1.0, t);
      synthSidechainGain.connect(this.musicGainNode);

      const bassOsc = this.ctx.createOscillator();
      const bassDrive = this.ctx.createWaveShaper();
      bassDrive.curve = this.getDistortionCurve(16) as any;
      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(280, t);
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(stepProg.bassFreq * 1.8, t);
      bassOsc.frequency.exponentialRampToValueAtTime(stepProg.bassFreq, t + 0.05);

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

      const kickBeats = isBuildBar
        ? [0, 0.75, 1.5, 2.0, 2.5, 3.0, 3.5]
        : isSlideBar
        ? [0, 1.75, 2.5, 3.25]
        : [0, 2.0, 3.25];

      kickBeats.forEach((kb) => {
        if (!this.ctx || !this.musicGainNode) return;
        const kt = t + kb * beatSec;

        synthSidechainGain.gain.setValueAtTime(0.25, kt);
        synthSidechainGain.gain.exponentialRampToValueAtTime(1.0, kt + 0.16);

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

      const snareBeats = isBuildBar
        ? [1.0, 1.5, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75]
        : [1.0, 3.0];

      snareBeats.forEach((sb, sIdx) => {
        if (!this.ctx || !this.musicGainNode) return;
        const st = t + sb * beatSec;
        const volMult = isBuildBar ? Math.min(1.0, 0.4 + (sIdx / snareBeats.length) * 0.6) : 1.0;

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

      const hatDivisions = isBuildBar ? 32 : 16;
      for (let h = 0; h < hatDivisions; h++) {
        const ht = t + (h * barSec) / hatDivisions;
        const hNoise = this.ctx.createBufferSource();
        hNoise.buffer = this.createNoiseBuffer(0.03);
        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.setValueAtTime(h % 4 === 0 ? 8500 : 10000, ht);

        const hGain = this.ctx.createGain();
        let vel = h % 4 === 0 ? 0.1 : h % 2 === 0 ? 0.065 : 0.04;
        if (h >= 12 && (barIndex === 1 || barIndex === 3 || barIndex === 5)) {
          vel = 0.09;
        }
        hGain.gain.setValueAtTime(vel, ht);
        hGain.gain.exponentialRampToValueAtTime(0.001, ht + 0.028);

        hNoise.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.musicGainNode);
        hNoise.start(ht);
      }

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
}
