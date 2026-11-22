import type { Page } from "@playwright/test";
import { expect, test, ytCalls } from "./fixtures";

/** Probe the Web Audio API: count contexts, oscillator pitches and noise sources, so tests can tell what the app made. */
async function probeAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audio: { contexts: number; freqs: number[]; sources: number }; AudioContext: typeof AudioContext };
    w.__audio = { contexts: 0, freqs: [], sources: 0 };
    const Original = w.AudioContext;
    w.AudioContext = class extends Original {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        w.__audio.contexts++;
      }
      createOscillator() {
        const osc = super.createOscillator();
        const set = osc.frequency.setValueAtTime.bind(osc.frequency);
        osc.frequency.setValueAtTime = (v: number, t: number) => { w.__audio.freqs.push(Math.round(v * 100) / 100); return set(v, t); };
        return osc;
      }
      createBufferSource() {
        w.__audio.sources++;
        return super.createBufferSource();
      }
    } as unknown as typeof AudioContext;
  });
}
const audio = (page: Page) => page.evaluate(() => (window as unknown as { __audio: { contexts: number; freqs: number[]; sources: number } }).__audio);
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

  test("Knowledge is never tied to music: listening for 30 minutes earns nothing", async ({ page }) => {
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

  test("mute on the splash is remembered and silences interface sounds", async ({ page }) => {
    await probeAudio(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Sound off" }).click(); // mutes (label shows the action available)
    await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible();
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible(); // still muted after a reload
    await enter(page);
    await page.waitForTimeout(500);
    expect((await audio(page)).freqs).not.toContain(880); // no doorbell while muted
  });
});
