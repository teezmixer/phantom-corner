import { expect, test as base, type Page } from "@playwright/test";

/**
 * A stand-in for https://www.youtube.com/iframe_api: a fake `YT.Player` that records every call in `window.__yt`
 * so tests can see what the app asked the player to do, and can emit player events. Tests never use the real network.
 * Knobs: `__yt.noPlay = true` makes play requests never start (autoplay blocked); `__yt.playDelay` sets the start delay.
 */
export const YOUTUBE_STUB = `
(function () {
  var yt = (window.__yt = { instances: [], calls: [], options: [], noPlay: false, playDelay: 30 });
  function Player(el, opts) {
    var self = this;
    var frame = document.createElement("div");
    frame.setAttribute("data-yt-player", "1");
    frame.style.width = opts.width + "px";
    frame.style.height = opts.height + "px";
    frame.style.background = "#222";
    el.replaceWith(frame);
    yt.instances.push(self);
    yt.options.push({ width: opts.width, height: opts.height, host: opts.host, playerVars: opts.playerVars });
    function rec() { yt.calls.push([].slice.call(arguments)); }
    function emit(state) { opts.events.onStateChange({ data: state }); }
    self._emit = emit;
    self._error = function (code) { opts.events.onError({ data: code }); };
    function start() { if (!yt.noPlay) setTimeout(function () { emit(1); }, yt.playDelay); }
    self.loadVideoById = function (id) { rec("load", id); self.id = id; emit(3); start(); };
    self.cueVideoById = function (id) { rec("cue", id); self.id = id; emit(5); };
    self.playVideo = function () { rec("play"); start(); };
    self.pauseVideo = function () { rec("pause"); emit(2); };
    self.setVolume = function (v) { rec("volume", v); };
    self.mute = function () { rec("mute"); };
    self.unMute = function () { rec("unmute"); };
    self.destroy = function () { rec("destroy"); frame.remove(); };
    setTimeout(function () { opts.events.onReady(); }, 0);
  }
  window.YT = { Player: Player };
  setTimeout(function () { if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady(); }, 0);
})();
`;

/** Answer external requests the app makes (Vercel analytics, YouTube) locally. Used for every page a test opens. */
export async function stubExternal(page: Page): Promise<void> {
  await page.route("**/_vercel/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await page.route("https://www.youtube.com/iframe_api", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: YOUTUBE_STUB }));
}

/**
 * Every e2e test fails on an uncaught exception or a console error, and never reaches the real network for
 * analytics or YouTube.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") problems.push(`console.error: ${m.text()}`); });
    await stubExternal(page);
    await provide(page);
    expect(problems).toEqual([]);
  },
});

export { expect };

/** What the fake YouTube player was asked to do, in order. */
export const ytCalls = (page: Page) => page.evaluate(() => (window as unknown as { __yt: { calls: unknown[][] } }).__yt.calls);
