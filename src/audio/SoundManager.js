/**
 * Audio Manager using Web Audio API procedural synthesis + Howler.js
 * Generates cozy romantic chords and chimes without requiring external audio files
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.isPlayingBgm = false;
    this.bgmTimer = null;
    this.currentTrack = 'nostalgic'; // 'nostalgic' | 'celebration'
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }
  }

  /** Smoothly ducks background music volume (e.g. when opening modals or reading letters) */
  duckBgm(factor = 0.35, duration = 0.4) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const currTime = this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(currTime);
      this.bgmGain.gain.linearRampToValueAtTime(factor, currTime + duration);
    } catch (e) {
      // Ignore audio timing warnings
    }
  }

  /** Smoothly restores background music volume back to full */
  restoreBgm(duration = 0.5) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const currTime = this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(currTime);
      this.bgmGain.gain.linearRampToValueAtTime(1.0, currTime + duration);
    } catch (e) {
      // Ignore audio timing warnings
    }
  }

  setBgmTrack(track = 'nostalgic') {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    if (this.isPlayingBgm && !this.isMuted) {
      this.duckBgm(0.05, 0.4);
      setTimeout(() => {
        if (this.isPlayingBgm) {
          if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
          }
          this.playBgmLoop();
          this.restoreBgm(0.6);
        }
      }, 420);
    }
  }

  startBgm() {
    this.init();
    if (this.isPlayingBgm || this.isMuted || !this.ctx) return;
    this.isPlayingBgm = true;
    this.playBgmLoop();
  }

  playBgmLoop() {
    if (!this.isPlayingBgm || this.isMuted) return;

    // Progression 1: Nostalgic romantic chords (Scenes 1 - 7)
    const nostalgicChords = [
      [261.63, 329.63, 392.00, 523.25], // C maj
      [220.00, 261.63, 329.63, 440.00], // A min
      [174.61, 261.63, 349.23, 440.00], // F maj
      [196.00, 246.94, 293.66, 392.00]  // G maj
    ];

    // Progression 2: Joyful celebratory acoustic chords with bells (Scene 8 Birthday Finale)
    const celebrationChords = [
      [392.00, 493.88, 587.33, 783.99], // G maj
      [293.66, 369.99, 440.00, 587.33], // D maj
      [329.63, 392.00, 493.88, 659.25], // E min
      [261.63, 329.63, 392.00, 523.25]  // C maj
    ];

    // Progression 3: Romantic Evening Graduation Waltz in 3/4 (Scene 7b Graduation Ball)
    const waltzBars = [
      { bass: 146.83, chord: [293.66, 369.99, 440.00], melody: 587.33 }, // D maj
      { bass: 123.47, chord: [246.94, 293.66, 369.99], melody: 493.88 }, // B min
      { bass: 98.00,  chord: [196.00, 246.94, 293.66], melody: 392.00 }, // G maj
      { bass: 110.00, chord: [220.00, 277.18, 329.63], melody: 440.00 }, // A maj
      { bass: 146.83, chord: [293.66, 369.99, 440.00], melody: 739.99 }, // D maj (high lead)
      { bass: 123.47, chord: [246.94, 293.66, 369.99], melody: 587.33 }, // B min
      { bass: 98.00,  chord: [196.00, 246.94, 293.66], melody: 493.88 }, // G maj
      { bass: 110.00, chord: [220.00, 293.66, 369.99], melody: 440.00 }  // A sus4 -> A
    ];

    let chordIndex = 0;

    const playNextChord = () => {
      if (!this.isPlayingBgm || this.isMuted) return;

      // 3/4 Romantic Graduation Ball Waltz
      if (this.currentTrack === 'waltz') {
        const bar = waltzBars[chordIndex % waltzBars.length];
        chordIndex++;

        // Beat 1: Warm bass tone + sweet music-box lead
        if (this.isPlayingBgm && !this.isMuted) {
          this.playBellNote(bar.bass, 2.5, 0.11, true);
          if (bar.melody) {
            this.playBellNote(bar.melody, 2.4, 0.065, true);
          }
        }

        // Beat 2: Soft harmonic chord
        setTimeout(() => {
          if (this.isPlayingBgm && !this.isMuted) {
            this.playBellNote(bar.chord[0], 1.6, 0.05, true);
            this.playBellNote(bar.chord[1], 1.6, 0.05, true);
          }
        }, 440);

        // Beat 3: Soft harmonic chord resolution
        setTimeout(() => {
          if (this.isPlayingBgm && !this.isMuted) {
            this.playBellNote(bar.chord[1], 1.6, 0.05, true);
            this.playBellNote(bar.chord[2], 1.6, 0.05, true);
          }
        }, 880);

        this.bgmTimer = setTimeout(playNextChord, 1320);
        return;
      }

      const isCeleb = this.currentTrack === 'celebration';
      const chords = isCeleb ? celebrationChords : nostalgicChords;
      const interval = isCeleb ? 2000 : 2800;
      const stepTime = isCeleb ? 280 : 450;
      const noteVol = isCeleb ? 0.09 : 0.08;

      const chord = chords[chordIndex % chords.length];
      chordIndex++;

      // Play arpeggio
      chord.forEach((freq, i) => {
        setTimeout(() => {
          if (this.isPlayingBgm && !this.isMuted) {
            this.playBellNote(freq, isCeleb ? 2.2 : 2.8, noteVol, true);
            // In celebration mode, add high sparkling bell chime accent on downbeats
            if (isCeleb && (i === 0 || i === 2)) {
              this.playBellNote(freq * 2, 1.4, 0.04, true);
            }
          }
        }, i * stepTime);
      });

      this.bgmTimer = setTimeout(playNextChord, interval);
    };

    playNextChord();
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }

  // Soft romantic music-box bell tone
  playBellNote(freq, duration = 1.5, volume = 0.1, isBgm = false) {
    if (this.isMuted || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      const targetNode = isBgm ? (this.bgmGain || this.ctx.destination) : (this.sfxGain || this.ctx.destination);
      gain.connect(targetNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  // Play button click chime
  playClick() {
    if (this.isMuted) return;
    this.playBellNote(523.25, 0.4, 0.12); // High C
    setTimeout(() => this.playBellNote(659.25, 0.5, 0.1), 80); // E
  }

  // Play sparkle sound
  playSparkle() {
    if (this.isMuted) return;
    const notes = [587.33, 659.25, 783.99, 880.00, 1046.50];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playBellNote(f, 0.8, 0.06), idx * 60);
    });
  }

  // Play step / tap sound
  playTap() {
    if (this.isMuted || !this.ctx) return;
    this.playBellNote(330, 0.15, 0.05);
  }

  // Play ukulele strum chord (G4-C4-E4-A4 tuning)
  playUkuleleStrum() {
    if (this.isMuted) return;
    const ukeNotes = [392.00, 261.63, 329.63, 440.00];
    ukeNotes.forEach((f, idx) => {
      setTimeout(() => this.playBellNote(f, 1.2, 0.12), idx * 45);
    });
  }

  // Play cute cat purr / meow
  playCatPurr() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, this.ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.09, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  // Play romantic chime / kiss arpeggio
  playRomanticChime() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
    notes.forEach((f, idx) => {
      setTimeout(() => this.playBellNote(f, 1.4, 0.08), idx * 60);
    });
  }

  // Play camera mechanical shutter click & flash chime
  playCameraShutter() {
    if (this.isMuted) return;
    this.playTap();
    setTimeout(() => this.playTap(), 65);
    setTimeout(() => this.playSparkle(), 130);
  }

  // Play classic school bell chime
  playSchoolBell() {
    if (this.isMuted || !this.ctx) return;
    const ringFreqs = [880, 1046.5, 880, 1046.5, 880, 1046.5];
    ringFreqs.forEach((f, idx) => {
      setTimeout(() => this.playBellNote(f, 0.3, 0.07), idx * 90);
    });
  }

  // Play grand celebratory fanfare for graduation
  playFanfare() {
    if (this.isMuted) return;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
    notes.forEach((f, idx) => {
      setTimeout(() => this.playBellNote(f, 1.8, 0.12), idx * 90);
    });
  }

  // Play crowd applause / clapping sound
  playApplause() {
    if (this.isMuted || !this.ctx) return;
    try {
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220 + Math.random() * 300, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(this.sfxGain || this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.08);
        }, i * 45 + Math.random() * 20);
      }
    } catch (e) {}
  }

  // Play playful dental tool sparkle sound
  playToothDrill() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  // Play cheerful student giggle / banter chime
  playGiggle() {
    if (this.isMuted) return;
    const notes = [659.25, 783.99, 659.25, 880.00];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playBellNote(f, 0.25, 0.06), idx * 70);
    });
  }

  // Play water fountain splash sound
  playFountainSplash() {
    if (this.isMuted || !this.ctx) return;
    try {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600 + Math.random() * 400, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(this.sfxGain || this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.15);
        }, i * 35);
      }
    } catch (e) {}
  }

  // Play celebratory champagne glass clink
  playChampagneClink() {
    if (this.isMuted) return;
    this.playBellNote(1760.0, 1.2, 0.12); // High A6 crystal ring
    setTimeout(() => this.playBellNote(1975.53, 0.9, 0.09), 30); // B6
  }

  // Play dance party beat tap
  playDanceBeat() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch (e) {}
  }

  // Play single candle puff extinguish sound
  playCandlePuff() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // Play metallic lamp / light switch click
  playLightSwitch() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // Play candle blowing out sound
  playCandleBlow() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }
}

export const soundManager = new SoundManager();
