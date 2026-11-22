import type { AmbienceRef } from "@/content/types";
import { buildAmbience, type AmbienceLayer } from "./ambience";
import { SFX, type SfxId } from "./sfx";

export interface BusSettings {
  muted: boolean;
  volumes: { ambience: number; ui: number };
  /** True while a session runs: interface sounds are halved. */
  uiDucked: boolean;
}

type ContextFactory = () => AudioContext;

/**
 * Web Audio for the interface and ambience buses. Music is the YouTube player's own volume (spec §4.8: "Volume is the
 * only mixing control"), so it is not routed here. The AudioContext is created by `unlock()` from a user gesture only —
 * nothing plays before the user's first click (spec §3.1, §3.9).
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private uiBus: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private settings: BusSettings = { muted: false, volumes: { ambience: 0.35, ui: 0.7 }, uiDucked: false };
  private layers = new Map<string, AmbienceLayer>();
  private layerLevels: Record<string, number> = {};

  constructor(private readonly makeContext: ContextFactory = () => new AudioContext()) {}

  get unlocked(): boolean {
    return this.ctx !== null;
  }

  /** Create and resume the AudioContext. Call from a click or key press; safe to call again. */
  unlock(): void {
    if (!this.ctx) {
      try {
        this.ctx = this.makeContext();
      } catch {
        return; // no Web Audio here: the app stays silent and fully usable
      }
      this.uiBus = this.ctx.createGain();
      this.ambienceBus = this.ctx.createGain();
      this.uiBus.connect(this.ctx.destination);
      this.ambienceBus.connect(this.ctx.destination);
      this.applyBuses();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
  }

  configure(next: BusSettings): void {
    this.settings = next;
    this.applyBuses();
  }

  private applyBuses(): void {
    if (!this.ctx || !this.uiBus || !this.ambienceBus) return;
    const { muted, volumes, uiDucked } = this.settings;
    const t = this.ctx.currentTime;
    this.uiBus.gain.setTargetAtTime(muted ? 0 : volumes.ui * (uiDucked ? 0.5 : 1), t, 0.02);
    this.ambienceBus.gain.setTargetAtTime(muted ? 0 : volumes.ambience, t, 0.05);
  }

  /** Play an interface sound (a no-op until unlocked or while muted). */
  playSfx(id: SfxId): void {
    if (!this.ctx || !this.uiBus || this.settings.muted) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + 0.005;
    for (const note of SFX[id]) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, start + note.at);
      if (note.freqEnd !== undefined) osc.frequency.linearRampToValueAtTime(note.freqEnd, start + note.at + note.dur);
      // Quick attack, exponential-style release: no clicks.
      env.gain.setValueAtTime(0.0001, start + note.at);
      env.gain.linearRampToValueAtTime(note.gain, start + note.at + 0.01);
      env.gain.linearRampToValueAtTime(0.0001, start + note.at + note.dur);
      osc.connect(env);
      env.connect(this.uiBus);
      osc.start(start + note.at);
      osc.stop(start + note.at + note.dur + 0.02);
    }
  }

  /** Replace the playing ambience with a location's layers. Silent until unlocked; levels come from `setLayerLevels`. */
  setAmbience(refs: readonly AmbienceRef[]): void {
    if (!this.ctx || !this.ambienceBus) return;
    const wanted = new Set(refs.map((r) => r.id));
    for (const [id, layer] of this.layers) {
      if (!wanted.has(id)) { layer.stop(); this.layers.delete(id); }
    }
    for (const ref of refs) {
      if (this.layers.has(ref.id)) continue;
      const layer = buildAmbience(this.ctx, ref.synth, this.ambienceBus);
      layer.setLevel(this.layerLevels[ref.id] ?? 1);
      this.layers.set(ref.id, layer);
    }
  }

  setLayerLevels(levels: Record<string, number>): void {
    this.layerLevels = levels;
    for (const [id, layer] of this.layers) layer.setLevel(levels[id] ?? 1);
  }

  /** Ids of the ambience layers currently playing. */
  get playingLayers(): string[] {
    return [...this.layers.keys()];
  }

  stopAmbience(): void {
    for (const layer of this.layers.values()) layer.stop();
    this.layers.clear();
  }
}
