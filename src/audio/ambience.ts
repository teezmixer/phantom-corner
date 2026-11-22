import type { AmbienceSynth } from "@/content/types";

/** How long an ambience layer fades out before it is stopped (travel, leaving the room). */
export const FADE_OUT_S = 0.15;

export interface AmbienceLayer {
  /** 0–1 within the ambience bus. */
  setLevel(level: number): void;
  stop(): void;
}

interface Recipe {
  /** Band-pass/low-pass character of the noise. */
  filter: BiquadFilterType;
  freq: number;
  q: number;
  /** Base level before the layer fader. */
  gain: number;
  /** Slow volume wobble: [rate in Hz, depth 0–1]. */
  lfo?: [number, number];
}

/** Placeholder ambience is filtered noise (no audio files — decision D-13); each is a rough stand-in for the real set. */
export const AMBIENCE: Record<AmbienceSynth, Recipe> = {
  rain: { filter: "highpass", freq: 1800, q: 0.4, gain: 0.5 },
  murmur: { filter: "bandpass", freq: 500, q: 0.7, gain: 0.45, lfo: [0.25, 0.4] },
  wind: { filter: "bandpass", freq: 350, q: 0.5, gain: 0.5, lfo: [0.12, 0.6] },
  room: { filter: "lowpass", freq: 260, q: 0.3, gain: 0.3 },
  city: { filter: "bandpass", freq: 900, q: 0.4, gain: 0.35, lfo: [0.08, 0.3] },
  hum: { filter: "lowpass", freq: 140, q: 0.8, gain: 0.5 },
};

/** One two-second buffer of white noise per context, shared by every layer (they differ only by their filters). */
const noiseCache = new WeakMap<AudioContext, AudioBuffer>();
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const cached = noiseCache.get(ctx);
  if (cached) return cached;
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseCache.set(ctx, buffer);
  return buffer;
}

export function buildAmbience(ctx: AudioContext, kind: AmbienceSynth, destination: AudioNode): AmbienceLayer {
  const recipe = AMBIENCE[kind];
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = recipe.filter;
  filter.frequency.value = recipe.freq;
  filter.Q.value = recipe.q;
  const fader = ctx.createGain(); // the user's per-layer level
  const wobble = ctx.createGain(); // slow LFO target
  wobble.gain.value = recipe.gain;
  source.connect(filter);
  filter.connect(wobble);
  wobble.connect(fader);
  fader.connect(destination);
  source.start();

  let lfo: OscillatorNode | null = null;
  if (recipe.lfo) {
    const [rate, depth] = recipe.lfo;
    lfo = ctx.createOscillator();
    lfo.frequency.value = rate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = recipe.gain * depth;
    lfo.connect(lfoGain);
    lfoGain.connect(wobble.gain);
    lfo.start();
  }

  return {
    setLevel: (level) => fader.gain.setTargetAtTime(Math.min(1, Math.max(0, level)), ctx.currentTime, 0.05),
    // A short fade, then stop: cutting a running noise source dead clicks.
    stop: () => {
      const end = ctx.currentTime + FADE_OUT_S;
      fader.gain.setTargetAtTime(0, ctx.currentTime, FADE_OUT_S / 4);
      try { source.stop(end); lfo?.stop(end); } catch { /* already stopped */ }
      setTimeout(() => fader.disconnect(), FADE_OUT_S * 1000 + 50);
    },
  };
}
