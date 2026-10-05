// Procedural Web Audio API sound generator for weapons and hits
class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.4;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        this.initialized = true;
    }

    ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
    }

    // Helper: Generate white noise buffer
    createNoiseBuffer(duration) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // Pistol: Crisp, snappy transient with moderate punch
    playPistol() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Punch sub-oscillator
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        oscGain.gain.setValueAtTime(0.7 * this.masterVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);

        // Noise crack
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.15);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.Q.setValueAtTime(2, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
    }

    // Automatic Rifle: Punchy, metallic, rapid mechanical snap
    playRifle() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Sub thud
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.14);

        oscGain.gain.setValueAtTime(0.8 * this.masterVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // Mid crack
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.18);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(1.5, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
    }

    // Scoped Sniper: Heavy explosive roar + high caliber crack + reverb tail
    playSniper() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Deep sub-bass boom
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

        oscGain.gain.setValueAtTime(1.2 * this.masterVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);

        // Aggressive sharp explosion noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3500, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.1 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);

        // Bolt action sound after 0.55s
        setTimeout(() => this.playBoltAction(), 450);
    }

    // Bolt action sound for sniper
    playBoltAction() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);

        // Click forward
        setTimeout(() => {
            if (!this.ctx) return;
            const t2 = this.ctx.currentTime;
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(900, t2);
            osc2.frequency.exponentialRampToValueAtTime(400, t2 + 0.06);
            gain2.gain.setValueAtTime(0.35 * this.masterVolume, t2);
            gain2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.06);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start(t2);
            osc2.stop(t2 + 0.07);
        }, 160);
    }

    // Hit marker ping (satisfying crisp bell/ding)
    playHit(isBullseye = false) {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const baseFreq = isBullseye ? 1320 : 980; // High crisp tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.03);

        gain.gain.setValueAtTime(0.45 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    // Critical metallic headshot 'dink' chime (iconic tactical helmet ping)
    playHeadshot() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Primary ringing helmet bell
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(1860, now);
        osc1.frequency.exponentialRampToValueAtTime(1420, now + 0.22);
        gain1.gain.setValueAtTime(0.6 * this.masterVolume, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // High crystal overtone chime
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2780, now);
        osc2.frequency.exponentialRampToValueAtTime(2150, now + 0.26);
        gain2.gain.setValueAtTime(0.42 * this.masterVolume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.29);

        // Sharp metallic transient snap
        this.playMechanicalClick(now, 2800, 0.03);
    }

    // Dry fire empty click
    playDryFire() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Reload sound (mag release + insert + slide rack)
    playReload() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Mag out
        this.playMechanicalClick(now, 450, 0.06);
        // Mag in
        this.playMechanicalClick(now + 0.5, 620, 0.08);
        // Slide release
        this.playMechanicalClick(now + 0.9, 850, 0.09);
    }

    playMechanicalClick(time, freq, dur) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + dur);
        gain.gain.setValueAtTime(0.3 * this.masterVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + dur + 0.01);
    }

    // Weapon switch swoosh
    playSwitch() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.1);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }
}

window.soundManager = new SoundManager();
