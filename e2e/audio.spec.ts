import type { Page } from "@playwright/test";
import { expect, test, ytCalls } from "./fixtures";

/** Probe the Web Audio API: count contexts, oscillator pitches and noise sources, so tests can tell what the app made. */
async function probeAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audio: { contexts: number; freqs: number[]; sources: number; stops: number; states: string[]; list: AudioContext[] }; AudioContext: typeof AudioContext };
    w.__audio = { contexts: 0, freqs: [], sources: 0, stops: 0, states: [], list: [] };
    const Original = w.AudioContext;
    w.AudioContext = class extends Original {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        w.__audio.contexts++;
        w.__audio.list.push(this);
      }
      createOscillator() {
        const osc = super.createOscillator();
        const set = osc.frequency.setValueAtTime.bind(osc.frequency);
        osc.frequency.setValueAtTime = (v: number, t: number) => { w.__audio.freqs.push(Math.round(v * 100) / 100); return set(v, t); };
        return osc;
      }
      createBufferSource() {
        w.__audio.sources++;
        const src = super.createBufferSource();
        const stop = src.stop.bind(src);
        src.stop = (when?: number) => { w.__audio.stops++; return stop(when); };
        return src;
      }
    } as unknown as typeof AudioContext;
  });
}
const audio = (page: Page) => page.evaluate(() => { const a = (window as unknown as { __audio: { contexts: number; freqs: number[]; sources: number; stops: number; list: AudioContext[] } }).__audio; return { contexts: a.contexts, freqs: a.freqs, sources: a.sources, stops: a.stops, states: a.list.map((c) => c.state) }; });
const enter = (page: Page) => page.getByRole("button", { name: "Press to enter" }).click();
const caption = (page: Page) => page.getByRole("region", { name: "TV" }).getByRole("status");

test.describe("TV", () => {
  test("has exactly one 200×200 player, only cued until the user presses play", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await expect(page.locator("[data-yt-player]")).toHaveCount(1);
    const box = (await page.locator("[data-yt-player]").boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(200);
    expect(box.height).toBeGreaterThanOrEqual(200);
    await page.waitForTimeout(300);
    const calls = await ytCalls(page);
    expect(calls.some((c) => c[0] === "cue")).toBe(true);
    expect(calls.some((c) => c[0] === "play" || (c[0] === "load"))).toBe(false); // nothing played by itself
    await expect(caption(page)).toHaveText("TV's off.");
  });

  test("the YouTube script is not requested until the user has entered", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => { if (r.url().includes("youtube.com")) requests.push(r.url()); });
    await page.goto("/");
    await page.waitForTimeout(400);
    expect(requests).toEqual([]);
    await enter(page);
    await expect.poll(() => requests.length).toBeGreaterThan(0);
  });

  test("play starts the cued track, shows its title, and pause stops it", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(caption(page)).toHaveText("Beneath the Mask");
    expect((await ytCalls(page)).some((c) => c[0] === "play")).toBe(true);
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(caption(page)).toContainText("Paused");
    expect((await ytCalls(page)).some((c) => c[0] === "pause")).toBe(true);
  });

  test("next and previous move through the playlist", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByRole("button", { name: "Next track" }).click();
    await expect(caption(page)).toHaveText("Beneath the Mask (rain)");
    await page.getByRole("button", { name: "Next track" }).click();
    await expect(caption(page)).toHaveText("Beneath the Mask (instrumental)");
    await page.getByRole("button", { name: "Previous track" }).click();
    await expect(caption(page)).toHaveText("Beneath the Mask (rain)");
  });

  test("a track that cannot play is skipped silently; when all fail the TV says so", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(caption(page)).toHaveText("Beneath the Mask");
    await page.evaluate(() => (window as unknown as { __yt: { instances: { _error(c: number): void }[] } }).__yt.instances.at(-1)!._error(150));
    await expect(caption(page)).toHaveText("Beneath the Mask (rain)"); // moved on without a message
    await page.evaluate(() => (window as unknown as { __yt: { instances: { _error(c: number): void }[] } }).__yt.instances.at(-1)!._error(101));
    await page.evaluate(() => (window as unknown as { __yt: { instances: { _error(c: number): void }[] } }).__yt.instances.at(-1)!._error(100));
    await expect(caption(page)).toHaveText("That tape's gone. Skipping it.");
    await expect(page.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  test("says so when the browser will not start playback, and recovers once it does", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.evaluate(() => { (window as unknown as { __yt: { noPlay: boolean } }).__yt.noPlay = true; });
    await page.getByRole("button", { name: "Play" }).click();
    await page.clock.fastForward(6000);
    await expect(caption(page)).toHaveText("It won't start on its own. Press play on the screen.");
    await page.evaluate(() => (window as unknown as { __yt: { noPlay: boolean; instances: { _emit(s: number): void }[] } }).__yt.instances.at(-1)!._emit(1));
    await expect(caption(page)).toHaveText("Beneath the Mask");
  });

  test("the player stays visible and uncovered while music plays, and under Hide UI", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByRole("button", { name: "Play" }).click();
    await page.keyboard.press("h");
    const tv = page.locator("[data-yt-player]");
    await expect(tv).toBeVisible();
    const covered = await tv.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(hit && (el === hit || el.contains(hit)));
    });
    expect(covered).toBe(false);
  });

  test("Knowledge comes from sessions, never from music: a session earns the same with the TV playing", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.getByRole("button", { name: "Play" }).click();
    await page.getByRole("button", { name: "Start" }).click();
    await page.clock.fastForward("25:05");
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
    // 25 focused minutes + 5 completion bonus = 30, exactly as without music
    await expect(page.getByRole("group", { name: "Level and Knowledge" })).toContainText(/Knowledge\s*30/);
  });

  test("listening alone for 30 minutes earns nothing", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.getByRole("button", { name: "Play" }).click();
    await page.clock.fastForward("30:00");
    await expect(page.getByRole("group", { name: "Level and Knowledge" })).toContainText(/Knowledge\s*0/);
  });

  test("the mixer sets the music volume and mute on the player, and the levels are saved", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByRole("button", { name: "Mixer" }).click();
    const music = page.getByLabel("Music volume");
    await music.fill("20");
    await expect.poll(async () => (await ytCalls(page)).filter((c) => c[0] === "volume").at(-1)?.[1]).toBe(20);
    await page.getByRole("button", { name: "Sound on" }).click();
    await expect.poll(async () => (await ytCalls(page)).some((c) => c[0] === "mute")).toBe(true);
    await page.getByLabel("Rain on glass level").fill("40");
    await page.waitForTimeout(500); // past the save debounce
    await page.reload();
    await enter(page);
    await page.getByRole("button", { name: "Mixer" }).click();
    await expect(page.getByLabel("Music volume")).toHaveValue("20");
    await expect(page.getByLabel("Rain on glass level")).toHaveValue("40");
  });
});

test.describe("sound", () => {
  test("nothing is created before the user's first click; the click unlocks audio", async ({ page }) => {
    await probeAudio(page);
    await page.goto("/");
    await page.waitForTimeout(400);
    expect((await audio(page)).contexts).toBe(0);
    await enter(page);
    await expect.poll(async () => (await audio(page)).contexts).toBe(1);
    await expect.poll(async () => (await audio(page)).states).toEqual(["running"]); // audio can actually come out
  });

  test("the doorbell rings on a first-ever arrival but not on a return visit", async ({ page }) => {
    await probeAudio(page);
    await page.goto("/");
    await enter(page);
    await expect.poll(async () => (await audio(page)).freqs).toEqual(expect.arrayContaining([880, 659.25]));
    await page.waitForTimeout(500); // let the first visit save
    await page.reload();
    await enter(page);
    await page.waitForTimeout(400);
    expect((await audio(page)).freqs).not.toContain(880);
  });

  test("the current location's ambience starts after entering and follows travel", async ({ page }) => {
    await probeAudio(page);
    await page.goto("/?dev=true");
    await enter(page);
    await expect.poll(async () => (await audio(page)).sources).toBe(2); // LeBlanc: rain + murmur
    await page.getByLabel("Jump to location").selectOption("ryuji");
    await expect.poll(async () => (await audio(page)).sources).toBe(4); // Ryuji's two layers replace them
    await expect.poll(async () => (await audio(page)).stops).toBeGreaterThanOrEqual(2); // …and LeBlanc's two were stopped, not left running
  });

  test("the session-complete fanfare plays when a session finishes, and the start sound when it begins", async ({ page }) => {
    await probeAudio(page);
    await page.clock.install();
    await page.goto("/");
    await page.clock.resume();
    await enter(page);
    await page.getByRole("button", { name: "Start" }).click();
    await expect.poll(async () => (await audio(page)).freqs).toContain(660); // sessionStart's second note
    await page.clock.fastForward("25:05");
    await expect(page.getByRole("dialog", { name: "Time." })).toBeVisible();
    await expect.poll(async () => (await audio(page)).freqs).toContain(1046.5); // the fanfare's last note
  });

  test("mute on the splash is remembered across a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sound off" }).click(); // the label is the action available: it mutes
    await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible();
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible(); // still muted after a reload
  });

  test("a muted first visit makes no sound at all: no doorbell, no interface sounds", async ({ page }) => {
    await probeAudio(page);
    await page.goto("/"); // a genuine first visit, so the doorbell WOULD ring if mute were ignored
    await page.getByRole("button", { name: "Sound off" }).click();
    await enter(page);
    await page.keyboard.press("m"); // menu open sound would play too
    await page.waitForTimeout(600);
    expect((await audio(page)).freqs).toEqual([]); // no oscillator was ever scheduled
  });

  test("control: the same first visit, unmuted, does ring the doorbell", async ({ page }) => {
    await probeAudio(page);
    await page.goto("/");
    await enter(page);
    await expect.poll(async () => (await audio(page)).freqs).toContain(880);
  });
});

test.describe("TV rules (review of M4)", () => {
  test("the player's inner area is a full 200×200 and its corners are not clipped or covered", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    const info = await page.getByTestId("tv-player").evaluate((box) => {
      const frame = box.querySelector("[data-yt-player]")!.getBoundingClientRect();
      const inner = { w: box.clientWidth, h: box.clientHeight };
      const b = box.getBoundingClientRect();
      const corners = [[frame.left + 1, frame.top + 1], [frame.right - 1, frame.top + 1], [frame.left + 1, frame.bottom - 1], [frame.right - 1, frame.bottom - 1]];
      const hits = corners.map(([x, y]) => { const el = document.elementFromPoint(x!, y!); return !!el && box.contains(el); });
      return { inner, frameFits: frame.bottom <= b.bottom - 1 && frame.right <= b.right - 1, hits, frame: { w: frame.width, h: frame.height } };
    });
    expect(info.inner.w).toBeGreaterThanOrEqual(200);
    expect(info.inner.h).toBeGreaterThanOrEqual(200);
    expect(info.frame).toEqual({ w: 200, h: 200 });
    expect(info.frameFits).toBe(true); // the bottom edge (YouTube's watermark) is not cut off
    expect(info.hits).toEqual([true, true, true, true]);
  });

  test("the player keeps YouTube's default chrome and the privacy-enhanced host", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.locator("[data-yt-player]").waitFor();
    const opts = await page.evaluate(() => (window as unknown as { __yt: { options: { width: number; height: number; host: string; playerVars: Record<string, unknown> }[] } }).__yt.options);
    expect(opts).toHaveLength(1);
    expect(opts[0]).toMatchObject({ width: 200, height: 200, host: "https://www.youtube-nocookie.com" });
    expect(opts[0]!.playerVars).not.toHaveProperty("controls"); // default chrome stays (spec §4.8)
  });

  test("demo mode does not contact YouTube until the first gesture", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => { if (r.url().includes("youtube.com")) requests.push(r.url()); });
    await page.goto("/?demo=true");
    await page.waitForTimeout(500);
    expect(requests).toEqual([]);
    await page.mouse.click(5, 5);
    await expect.poll(() => requests.length).toBeGreaterThan(0);
  });

  test("on a short window the TV never covers the todo widget (the sign gives way)", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 500 });
    await page.goto("/");
    await enter(page);
    const rects = await page.evaluate(() => {
      const r = (el: Element | null) => { const b = el!.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
      return { tv: r(document.querySelector('section[aria-label="TV"]')), todo: r(document.querySelector('[data-widget="todo"]')) };
    });
    const overlap = rects.tv.l < rects.todo.r && rects.tv.r > rects.todo.l && rects.tv.t < rects.todo.b && rects.tv.b > rects.todo.t;
    expect(overlap).toBe(false);
    expect(rects.tv.b - rects.tv.t).toBeGreaterThanOrEqual(200);
  });

  test("no screen is covered by the TV's caption or mixer, at the smallest supported window", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.goto("/?demo=true&at=menu");
    await page.mouse.click(5, 5); // a gesture, so the TV exists
    const rects = await page.evaluate(() => {
      const panel = document.querySelector('[role="dialog"] > div')!.getBoundingClientRect();
      const tv = document.querySelector('section[aria-label="TV"]')!.getBoundingClientRect();
      const mixer = document.querySelector('[role="group"][aria-label="Mixer"]');
      const caption = document.querySelector('section[aria-label="TV"] [role="status"]')!.getBoundingClientRect();
      return { panelRight: panel.right, tvLeft: tv.left, mixerOpen: !!mixer, captionW: caption.width, captionH: caption.height };
    });
    expect(rects.panelRight).toBeLessThanOrEqual(rects.tvLeft); // the dialog ends before the TV begins
    expect(rects.mixerOpen).toBe(false);
    expect(rects.captionW * rects.captionH).toBeLessThanOrEqual(2); // screen-reader-only while a screen is open
  });

  test("Escape closes the mixer and returns focus to its button", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    const button = page.getByRole("button", { name: "Mixer" });
    await button.click();
    await expect(page.getByRole("group", { name: "Mixer" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("group", { name: "Mixer" })).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});

test.describe("switching tracks (found by playing it in a real browser)", () => {
  test("pressing next while playing keeps playing the new track — the player's transient pause between videos is not a user pause", async ({ page }) => {
    await page.goto("/");
    await enter(page);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(caption(page)).toHaveText("Beneath the Mask");
    await page.getByRole("button", { name: "Next track" }).click();
    await expect(caption(page)).toHaveText("Beneath the Mask (rain)"); // playing, not "Paused — …"
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await page.waitForTimeout(400);
    await expect(caption(page)).toHaveText("Beneath the Mask (rain)");
    const calls = await ytCalls(page);
    expect(calls.filter((c) => c[0] === "pause")).toHaveLength(0); // we never told the new track to pause
  });
});

test("on a very short window the whole player stays on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 330 });
  await page.goto("/");
  await enter(page);
  const box = (await page.getByTestId("tv-player").boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(330); // the bottom (YouTube's watermark) is not pushed off-screen
});
