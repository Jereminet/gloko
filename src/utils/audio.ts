// Web Audio API Synthesizer for subtle bubble click sound, ping bell chime, and window minimize sound
// Engineered with robust mobile support (iOS Safari & Android WebKit touch unlocking)

let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Mobile-friendly audio unlocker triggered on touch/pointer events.
 * Crucial for iOS WebKit: creates & plays a silent buffer inside the user gesture.
 */
export function unlockAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Universal iOS WebKit unlock: play a silent 1-sample buffer
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {}
}

/**
 * Play a subtle, organic bubble "pop" / "bloop" sound on button clicks.
 * Tuned with higher presence for crisp audibility on both desktop and mobile speakers.
 */
export function playBubbleSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    
    // Quick rising pitch sweep that characterizes a cheerful bubble bloop
    const baseFreq = 520 + Math.random() * 70;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.85, now + 0.045);

    // Envelope with clean mobile presence
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  } catch {
    // Graceful fallback for restricted environments
  }
}

/**
 * Play a bright crystal bell chime sound effect for the Ping action.
 * Rich harmonic overtone stack with shimmering exponential ring.
 */
export function playBellSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Bell harmonic frequencies (crisp overtones tuned for phone & desktop speakers)
    const frequencies = [1318.5, 2637, 3955.5, 5274];
    const gains = [0.24, 0.14, 0.08, 0.04];
    const decayTimes = [0.75, 0.55, 0.35, 0.2];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1, now);
    masterGain.connect(ctx.destination);

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gains[i], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTimes[i]);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decayTimes[i] + 0.05);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a gentle, descending "minimize" / closing sound when exiting windows, modals, or drawers.
 * Descends from ~680Hz down to ~260Hz so it remains audible on mobile phone speakers while smooth.
 */
export function playMinimizeSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    subOsc.type = 'triangle';

    // Downward pitch sweep conveying smooth minimization / closing away
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.13);

    subOsc.frequency.setValueAtTime(450, now);
    subOsc.frequency.exponentialRampToValueAtTime(180, now + 0.13);

    // Smooth soft volume envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.16);
    subOsc.stop(now + 0.16);
  } catch {
    // Graceful fallback
  }
}

