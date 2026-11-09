// Web Audio API Sound Synthesizer & Procedural Arcade Music for TCG Card Game
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmGain = null;
    this.pools = new Map();
  }

  // Safe asset path resolver respecting base URL in dev and production
  _getAssetPath(subpath) {
    if (!subpath) return '';
    const clean = subpath.startsWith('/') ? subpath.slice(1) : subpath;
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    return base.endsWith('/') ? `${base}${clean}` : `${base}/${clean}`;
  }

  // Preloaded audio element pool to prevent memory leaks and garbage-collection stutters
  _getPool(path, poolSize = 3) {
    if (!this.pools) this.pools = new Map();
    if (this.pools.has(path)) return this.pools.get(path);
    const pool = [];
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      try {
        for (let i = 0; i < poolSize; i++) {
          const a = new Audio(path);
          a.preload = 'auto';
          pool.push(a);
        }
      } catch (e) {
        // Safe fallback if audio construction fails
      }
    }
    const poolObj = { pool, index: 0 };
    this.pools.set(path, poolObj);
    return poolObj;
  }

  // Play audio from pool with automatic round-robin channel allocation and fallback
  _playFromPool(path, volume = 0.55, fallbackFn = null) {
    if (this.muted) return;
    try {
      const poolObj = this._getPool(path);
      if (!poolObj || !poolObj.pool || poolObj.pool.length === 0) {
        if (fallbackFn) fallbackFn();
        return;
      }
      const audio = poolObj.pool[poolObj.index];
      poolObj.index = (poolObj.index + 1) % poolObj.pool.length;
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {
        if (fallbackFn) fallbackFn();
      });
    } catch {
      if (fallbackFn) fallbackFn();
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn('Audio autoplay blocked until user interaction.'));
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.bgmPlaying) {
      this.stopBGM();
    }
    return this.muted;
  }

  // Arcade UI Hover Blip
  playMenuHover() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn(e);
    }
  }

  // Arcade Menu Confirm / Select
  playMenuSelect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      console.warn(e);
    }
  }

  // Game Start / Ready Fanfare
  playGameStart() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [330, 440, 554, 659, 880];
      freqs.forEach((f, i) => {
        setTimeout(() => {
          if (this.muted || !this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = i === freqs.length - 1 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(f, now);

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.35);
        }, i * 90);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Power Up / Loading Complete Swell
  playPowerUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn(e);
    }
  }

  // Card select/play chime
  playCard() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  // Dice rolling tumble sound
  playDiceRoll() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      }, i * 90);
    }
  }

  // Combat Hit / Damage
  playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }

  // Punch SFX (Tiers: 'light' | 'medium' | 'heavy' | 'critical')
  playPunch(tier = 'medium') {
    if (this.muted) return;
    const tierMap = {
      light: [1, 2, 3, 4, 5],
      medium: [6, 7, 8, 13, 14, 15],
      heavy: [16, 17, 18, 19],
      critical: [9, 10, 11, 12],
      ko: [9, 10, 11, 12]
    };
    const list = tierMap[tier] || tierMap.medium;
    const idx = list[Math.floor(Math.random() * list.length)];
    const path = this._getAssetPath(`SFX/PUNCH ${idx} SFX.mp3`);
    this._playFromPool(path, 0.55, () => this.playHit());
  }

  // Multi-punch flurry for dice-scaled moves (e.g. Fire of Fury, Savage Paws)
  playMultiPunch(hits = 2, tier = 'light') {
    if (this.muted) return;
    const count = Math.min(6, Math.max(1, hits || 2));
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.muted) this.playPunch(tier);
      }, i * 110);
    }
  }

  // Whip SFX (sharp crack for Queeny Hair Whip & Kiko Tail Whip)
  playWhip() {
    if (this.muted) return;
    const path = this._getAssetPath('SFX/Whip SFX.mp3');
    this._playFromPool(path, 0.6, () => this.playHit());
  }

  // Hee Hee Vocal Taunt & Mockery
  playHeeHee() {
    if (this.muted) return;
    const path = this._getAssetPath('SFX/HEE HEE SFX.mp3');
    this._playFromPool(path, 0.65, () => this.playTaunt());
  }

  // Dynamic Combat Damage SFX: automatically scales punch weight to damage amount
  playDamage(damageOrOptions = 10, isFatal = false) {
    if (this.muted) return;
    let amount = 10;
    let fatal = isFatal;
    if (typeof damageOrOptions === 'object' && damageOrOptions !== null) {
      amount = Number(damageOrOptions.damage ?? damageOrOptions.hp ?? 10);
      fatal = Boolean(damageOrOptions.isFatal ?? isFatal);
    } else if (typeof damageOrOptions === 'number') {
      amount = damageOrOptions;
    }

    if (fatal || amount >= 50) {
      this.playPunch('critical');
    } else if (amount >= 30) {
      this.playPunch('heavy');
    } else if (amount >= 15) {
      this.playPunch('medium');
    } else {
      this.playPunch('light');
    }
  }

  // Attack declaration / execution
  playAttack(attackName = '', damage = 10) {
    if (this.muted) return;
    const upper = String(attackName || '').toUpperCase();
    if (upper.includes('WHIP')) {
      this.playWhip();
    } else {
      this.playDamage(damage);
    }
  }

  playDefeat() {
    this.playZombie();
  }

  playTurnWarning() {
    this.playTimeout();
  }

  // Energy Token Claim
  playEnergy() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  // Heal / Antidote chime
  playHeal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }

  // Zombie Transformation / Groan
  playZombie() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.4);
      osc.frequency.linearRampToValueAtTime(110, now + 0.7);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn(e);
    }
  }

  // Menu Navigation Click
  playMenuSelect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn(e);
    }
  }

  playTaunt(withVocal = false) {
    if (this.muted) return;
    if (withVocal) {
      this.playHeeHee();
      return;
    }
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Note 1: First cheerful chirp — ascending bright sine
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      osc1.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
      gain1.gain.setValueAtTime(0.0, now);
      gain1.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2: Second chirp — slightly higher, delayed (playful ta-DA feel)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1600, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.30);
      gain2.gain.setValueAtTime(0.0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.18, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.33);

    } catch (e) {
      console.warn(e);
    }
  }

  // Turn Timer Tick
  playTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn(e);
    }
  }

  // Turn Timeout Alarm
  playTimeout() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  // Victory Fanfare
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      }, idx * 140);
    });
  }

  // Procedural Arcade Cyber Synth BGM Loop
  startBGM() {
    if (this.muted || this.bgmPlaying) return;
    this.init();
    if (!this.ctx) return;
    this.bgmPlaying = true;

    const scale = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25]; // A Minor pentatonic / cyber scale
    const bass = [110, 110, 130.81, 146.83];
    let step = 0;

    const playStep = () => {
      if (!this.bgmPlaying || this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;

        // Arpeggiator Lead Note
        const noteFreq = scale[step % scale.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);

        // Sub Bass Pulse every 4 steps
        if (step % 4 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          const bassFreq = bass[Math.floor(step / 4) % bass.length];

          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.05, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

          bassOsc.connect(bassGain);
          bassGain.connect(this.ctx.destination);

          bassOsc.start(now);
          bassOsc.stop(now + 0.4);
        }

        step = (step + 1) % 32;
        this.bgmTimer = setTimeout(playStep, 220); // ~136 BPM feel
      } catch (e) {
        console.warn(e);
      }
    };

    playStep();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBGM() {
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }
}

export const soundFX = new SoundEffects();

