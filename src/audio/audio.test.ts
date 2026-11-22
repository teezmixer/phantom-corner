import { describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./engine";
import { SFX, sfxDuration, type SfxId } from "./sfx";
import { AMBIENCE } from "./ambience";

/** A minimal fake of the parts of AudioContext the engine uses, recording what is created and scheduled. */
function fakeContext(initial: "suspended" | "running" = "suspended") {
  const log = { oscillators: 0, sources: 0, starts: [] as number[], busGains: [] as number[], resumed: 0 };
  const param = (value = 0) => ({
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn((v: number) => { log.busGains.push(v); }),
  });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const ctx = {
    state: initial,
    currentTime: 0,
    sampleRate: 100,
    destination: node(),
    resume: vi.fn(async () => { log.resumed++; ctx.state = "running"; }),
    createGain: vi.fn(() => ({ ...node(), gain: param(1) })),
    createOscillator: vi.fn(() => { log.oscillators++; return { ...node(), type: "sine", frequency: param(), start: vi.fn((t: number) => log.starts.push(t)), stop: vi.fn() }; }),
    createBiquadFilter: vi.fn(() => ({ ...node(), type: "lowpass", frequency: param(), Q: param() })),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(200) })),
    createBufferSource: vi.fn(() => { log.sources++; return { ...node(), buffer: null, loop: false, start: vi.fn(), stop: vi.fn() }; }),
  };
  return { ctx: ctx as unknown as AudioContext, raw: ctx, log };
}

describe("synthesised interface sounds (no audio files)", () => {
  const ids = Object.keys(SFX) as SfxId[];

  it("defines every interface sound the spec lists (§3.9) plus the doorbell", () => {
    expect(ids.sort()).toEqual(["doorbell", "menuClose", "menuOpen", "select", "sessionComplete", "sessionStart", "travel"]);
  });

  it.each(ids)("%s has audible, bounded notes", (id) => {
    for (const note of SFX[id]) {
      expect(note.freq).toBeGreaterThan(40);
      expect(note.freq).toBeLessThan(5000);
      expect(note.dur).toBeGreaterThan(0);
      expect(note.gain).toBeGreaterThan(0);
      expect(note.gain).toBeLessThanOrEqual(0.7);
    }
    expect(sfxDuration(id)).toBeLessThan(1.5); // short enough never to feel like a track
  });

  it("completion is the loudest sound: the one loud moment (spec §3.9)", () => {
    const peak = (id: SfxId) => Math.max(...SFX[id].map((n) => n.gain));
    for (const id of ids.filter((i) => i !== "sessionComplete")) expect(peak("sessionComplete")).toBeGreaterThan(peak(id));
  });
});

describe("AudioEngine", () => {
  it("makes no AudioContext until unlock() — nothing can play before the user's gesture", () => {
    const make = vi.fn(() => fakeContext().ctx);
    const engine = new AudioEngine(make);
    engine.playSfx("select");
    engine.setAmbience([{ id: "x", label: "x", synth: "rain" }]);
    expect(make).not.toHaveBeenCalled();
    expect(engine.unlocked).toBe(false);
    engine.unlock();
    expect(make).toHaveBeenCalledTimes(1);
    expect(engine.unlocked).toBe(true);
  });

  it("resumes a suspended context on unlock and is safe to call repeatedly", () => {
    const f = fakeContext("suspended");
    const make = vi.fn(() => f.ctx);
    const engine = new AudioEngine(make);
    engine.unlock();
    engine.unlock();
    expect(make).toHaveBeenCalledTimes(1);
    expect(f.log.resumed).toBeGreaterThanOrEqual(1);
  });

  it("stays silent and does not throw when Web Audio is unavailable", () => {
    const engine = new AudioEngine(() => { throw new Error("no audio"); });
    expect(() => engine.unlock()).not.toThrow();
    expect(() => engine.playSfx("select")).not.toThrow();
    expect(engine.unlocked).toBe(false);
  });

  it("plays one oscillator per note, and nothing while muted", () => {
    const f = fakeContext("running");
    const engine = new AudioEngine(() => f.ctx);
    engine.unlock();
    engine.playSfx("sessionComplete");
    expect(f.log.oscillators).toBe(SFX.sessionComplete.length);
    engine.configure({ muted: true, volumes: { ambience: 0.3, ui: 0.7 }, uiDucked: false });
    engine.playSfx("sessionComplete");
    expect(f.log.oscillators).toBe(SFX.sessionComplete.length); // unchanged
  });

  it("sets bus gains from volumes, mute and the running-session duck", () => {
    const f = fakeContext("running");
    const engine = new AudioEngine(() => f.ctx);
    engine.unlock();
    f.log.busGains.length = 0;
    engine.configure({ muted: false, volumes: { ambience: 0.4, ui: 0.8 }, uiDucked: false });
    expect(f.log.busGains).toEqual([0.8, 0.4]); // ui, ambience
    f.log.busGains.length = 0;
    engine.configure({ muted: false, volumes: { ambience: 0.4, ui: 0.8 }, uiDucked: true });
    expect(f.log.busGains[0]).toBeCloseTo(0.4); // interface sounds halve while a session runs
    f.log.busGains.length = 0;
    engine.configure({ muted: true, volumes: { ambience: 0.4, ui: 0.8 }, uiDucked: false });
    expect(f.log.busGains).toEqual([0, 0]);
  });

  it("starts a location's ambience layers, replaces them on travel, and stops them", () => {
    const f = fakeContext("running");
    const engine = new AudioEngine(() => f.ctx);
    engine.unlock();
    engine.setAmbience([{ id: "a-rain", label: "Rain", synth: "rain" }, { id: "a-murmur", label: "Murmur", synth: "murmur" }]);
    expect(engine.playingLayers.sort()).toEqual(["a-murmur", "a-rain"]);
    expect(f.log.sources).toBe(2);
    engine.setAmbience([{ id: "b-wind", label: "Wind", synth: "wind" }]); // travel
    expect(engine.playingLayers).toEqual(["b-wind"]);
    engine.setAmbience([{ id: "b-wind", label: "Wind", synth: "wind" }]); // same set: nothing restarts
    expect(f.log.sources).toBe(3);
    engine.stopAmbience();
    expect(engine.playingLayers).toEqual([]);
  });

  it("applies a per-layer level to the right layer, clamped to 0–1", () => {
    const f = fakeContext("running");
    const engine = new AudioEngine(() => f.ctx);
    engine.unlock();
    engine.setAmbience([{ id: "a-rain", label: "Rain", synth: "rain" }]);
    f.log.busGains.length = 0;
    engine.setLayerLevels({ "a-rain": 0.3 });
    expect(f.log.busGains).toContain(0.3);
    f.log.busGains.length = 0;
    engine.setLayerLevels({ "a-rain": 7 });
    expect(f.log.busGains).toContain(1); // never above full
    f.log.busGains.length = 0;
    engine.setLayerLevels({ "somewhere-else": 0.1 }); // a layer that is not playing changes nothing
    expect(f.log.busGains).toEqual([1]); // a-rain falls back to full level; the unknown id is ignored
  });

  it("a layer started after its level was set uses that level straight away", () => {
    const f = fakeContext("running");
    const engine = new AudioEngine(() => f.ctx);
    engine.unlock();
    engine.setLayerLevels({ "late-wind": 0.2 });
    f.log.busGains.length = 0;
    engine.setAmbience([{ id: "late-wind", label: "Wind", synth: "wind" }]);
    expect(f.log.busGains).toContain(0.2);
  });

  it("defines a recipe for every ambience kind a location can name", () => {
    expect(Object.keys(AMBIENCE).sort()).toEqual(["city", "hum", "murmur", "rain", "room", "wind"]);
  });
});
