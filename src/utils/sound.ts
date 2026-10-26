/**
 * Web Audio API synthesized sound generator
 * All sounds use the beloved soft, muted "undo completed items" tap sound.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * The signature soft, muted paper tap (the exact sound from undoing completed items)
 */
export function playSoftTap(enabled: boolean = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Sine wave gliding 220Hz -> 80Hz through 600Hz lowpass filter
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

    filter.type = 'lowpass';
    filter.frequency.value = 600;

    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {
    console.debug('Soft tap sound error', err);
  }
}

/**
 * Standard click sound - identical to undo sound
 */
export function playClickSound(enabled: boolean = true) {
  playSoftTap(enabled);
}

/**
 * Checking off item - identical to undo sound as requested
 */
export function playDingSound(enabled: boolean = true) {
  playSoftTap(enabled);
}

/**
 * Scribble sound - identical to undo sound as requested
 */
export function playScribbleSound(enabled: boolean = true) {
  playSoftTap(enabled);
}

/**
 * Completion / Celebration - gentle double tap of the exact same soft undo sound
 */
export function playCelebrationFanfare(enabled: boolean = true) {
  if (!enabled) return;
  playSoftTap(enabled);
  setTimeout(() => {
    playSoftTap(enabled);
  }, 120);
}

/**
 * Ambient background noise generator (whisper-soft)
 */
let ambientNode: AudioNode | null = null;
let ambientGain: GainNode | null = null;

export function setAmbientSound(type: 'none' | 'pencil' | 'rain', volume: number = 0.015) {
  try {
    if (ambientNode) {
      ambientNode.disconnect();
      ambientNode = null;
    }
    if (ambientGain) {
      ambientGain.disconnect();
      ambientGain = null;
    }

    if (type === 'none') return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.015 * white) / 1.015;
      lastOut = data[i];
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    source.start();
    ambientNode = source;
  } catch (err) {
    console.debug('Ambient audio error', err);
  }
}
