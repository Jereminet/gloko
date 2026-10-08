// Web Audio API Synthesizer for subtle bubble click sound & ping bell chime

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Play a subtle, organic bubble "pop" / "bloop" sound on every button click.
 * Subtle volume, brief duration (~60ms), pleasing pitch sweep.
 */
export function playBubbleSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    
    // Quick rising pitch sweep that characterizes a bubble bloop
    // Randomize slightly between 480Hz and 540Hz for organic variation
    const baseFreq = 480 + Math.random() * 60;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.9, now + 0.05);

    // Subtle gentle volume envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
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

    const now = ctx.currentTime;
    
    // Bell harmonic frequencies (high E6 bell fundamental + crisp overtones)
    const frequencies = [1318.5, 2637, 3955.5, 5274];
    const gains = [0.22, 0.12, 0.07, 0.04];
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
