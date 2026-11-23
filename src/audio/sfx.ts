/**
 * Interface sounds as DATA: short synthesised tones, no audio files (spec §3.9; decision D-13).
 * Every recipe is a placeholder for real, licensed sounds; the sound design is the owner's call.
 */
export type SfxId = "select" | "menuOpen" | "menuClose" | "travel" | "sessionStart" | "sessionComplete" | "doorbell" | "missionDone" | "breakEnd";

export interface Note {
  /** Seconds after the sound starts. */
  at: number;
  dur: number;
  freq: number;
  /** If set, the pitch glides from `freq` to this over the note. */
  freqEnd?: number;
  type: OscillatorType;
  /** Peak level 0–1 before the bus volume. */
  gain: number;
}

export const SFX: Record<SfxId, readonly Note[]> = {
  select: [{ at: 0, dur: 0.07, freq: 880, type: "triangle", gain: 0.5 }],
  menuOpen: [{ at: 0, dur: 0.16, freq: 220, freqEnd: 660, type: "sawtooth", gain: 0.3 }],
  menuClose: [{ at: 0, dur: 0.13, freq: 660, freqEnd: 220, type: "sawtooth", gain: 0.3 }],
  travel: [
    { at: 0, dur: 0.18, freq: 440, freqEnd: 330, type: "triangle", gain: 0.4 },
    { at: 0.16, dur: 0.18, freq: 330, freqEnd: 220, type: "triangle", gain: 0.4 },
    { at: 0.32, dur: 0.3, freq: 220, freqEnd: 110, type: "triangle", gain: 0.4 },
  ],
  sessionStart: [
    { at: 0, dur: 0.1, freq: 440, type: "triangle", gain: 0.4 },
    { at: 0.1, dur: 0.16, freq: 660, type: "triangle", gain: 0.4 },
  ],
  // The one loud moment (spec §3.9): a rising four-note arpeggio, louder than anything else.
  sessionComplete: [
    { at: 0, dur: 0.16, freq: 523.25, type: "square", gain: 0.55 },
    { at: 0.14, dur: 0.16, freq: 659.25, type: "square", gain: 0.55 },
    { at: 0.28, dur: 0.16, freq: 783.99, type: "square", gain: 0.55 },
    { at: 0.42, dur: 0.5, freq: 1046.5, type: "square", gain: 0.6 },
  ],
  // Marking the mission done: a small rising pair, clearly less than the session fanfare (spec §3.9: one loud moment).
  missionDone: [
    { at: 0, dur: 0.12, freq: 659.25, type: "triangle", gain: 0.45 },
    { at: 0.1, dur: 0.28, freq: 880, type: "triangle", gain: 0.45 },
  ],
  // The break is over: two soft sine notes, falling, like a bell that is not asking for anything.
  breakEnd: [
    { at: 0, dur: 0.3, freq: 784, type: "sine", gain: 0.4 },
    { at: 0.25, dur: 0.5, freq: 587.33, type: "sine", gain: 0.4 },
  ],
  doorbell: [
    { at: 0, dur: 0.45, freq: 880, type: "sine", gain: 0.5 },
    { at: 0.4, dur: 0.6, freq: 659.25, type: "sine", gain: 0.5 },
  ],
};

/** Total length of a sound in seconds. */
export function sfxDuration(id: SfxId): number {
  return Math.max(...SFX[id].map((n) => n.at + n.dur));
}

/** Interface sounds drop to half while a session runs (spec §3.9: calm while the timer runs). */
export const RUNNING_DUCK = 0.5;
