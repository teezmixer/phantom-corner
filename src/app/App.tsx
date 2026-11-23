import { Suspense, useEffect, useState } from "react";
import { demo as demoCopy, HOW_BUILT_URL, morgana } from "@/content/copy";
import { BASE_TITLE, tabTitle } from "@/domain/title";
import { useNow } from "@/hooks/useNow";
import { isTypingTarget, shortcutAction } from "@/hooks/shortcuts";
import { useStore } from "@/state/StoreProvider";
import { onboardingRunning, type Layer } from "@/state/store";
import { forgetOpener } from "@/screens/openerFocus";
import { Splash } from "@/screens/Splash/Splash";
import { Banner } from "./Banner";
import { DevPanel } from "./DevPanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { LAYER_SCREENS, prefetchScreens, Room } from "./screens";

/**
 * Ends a session when its time is up. Lives here, not in the timer widget, so a session still completes when the timer
 * widget is hidden in Settings or the whole HUD is hidden (a session started with Space must not run forever unseen).
 */
function SessionClock() {
  const { state, dispatch } = useStore();
  const now = useNow(250);
  const timer = state.timer;
  useEffect(() => {
    if (timer.status === "running" && now >= timer.endsAt) dispatch({ type: "TIMER", event: { type: "TICK", now }, now });
  }, [timer, now, dispatch]);
  return null;
}

/** How long the player idles in the room before the place says an idle line. PROVISIONAL (D-32). */
export const IDLE_AFTER_MS = 90_000;

/**
 * After a while of idling in the room (timer not running, nothing open, in a real visit) the place says one line, once per
 * stretch of idling. Any activity that leaves the room or starts the timer cancels the wait.
 */
function IdleVoice() {
  const { state, dispatch } = useStore();
  const armed = state.entered && state.layer === "main" && state.timer.status === "idle" && !state.idleSaid && !state.demo && !onboardingRunning(state);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => dispatch({ type: "SAY_IDLE" }), IDLE_AFTER_MS);
    return () => clearTimeout(id);
  }, [armed, dispatch]);
  return null;
}

/** Keeps the tab title in step with the timer so the countdown shows from other tabs (spec §3.6). */
function TabTitle() {
  const { state } = useStore();
  const now = useNow(1000);
  const title = tabTitle(state.timer, now);
  useEffect(() => { document.title = title; }, [title]);
  useEffect(() => () => { document.title = BASE_TITLE; }, []);
  return null;
}

/** Shown once saving stops working, so nobody believes progress is kept when it is not (spec §3.11). */
function StorageNotice() {
  const { state } = useStore();
  if (!state.entered || !state.storageBlocked) return null;
  return (
    <p role="status" className="fixed bottom-2 left-1/2 z-30 max-w-xl -translate-x-1/2 border-2 border-white bg-black px-3 py-2 text-center font-body-primary text-sm text-white">
      {morgana.cantWrite}
    </p>
  );
}

/** Composition root: the room is always underneath once entered; one `layer` decides what sits on top. */
/**
 * Demo mode's tag (spec §3.12): says it is a demo and a fan project, and links to how it was built.
 * DECISION: D-34 — placement and look are placeholders; kept plain at the top centre, clear of the corner groups.
 */
function DemoTag() {
  return (
    <p className="fixed left-1/2 top-1 z-40 -translate-x-1/2 border border-white bg-black px-2 py-0.5 font-body-primary text-xs text-white">
      {demoCopy.tag} · {demoCopy.fan} · <a href={HOW_BUILT_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-redbright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentteal">{demoCopy.howBuilt}</a>
    </p>
  );
}

/** Dev tools only: renders and throws, to see the crash card for real (DevPanel "Crash a screen / the app"). */
function DevBoom(): never {
  throw new Error("Forced crash from the developer tools");
}

function LayerView({ layer }: { layer: Layer }) {
  const Screen = LAYER_SCREENS[layer];
  return Screen ? <Screen /> : null;
}

export function App({ dev }: { dev: boolean }) {
  const { state, derived, dispatch } = useStore();
  useEffect(prefetchScreens, []);
  // Back in the room: no screen is waiting to be given focus back any more.
  useEffect(() => { if (state.layer === "main") forgetOpener(); }, [state.layer]);
  const [devCrash, setDevCrash] = useState<"screen" | "app" | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      const action = shortcutAction(e.key, state, derived, Date.now(), {
        typing: isTypingTarget(target),
        onButton: target instanceof HTMLElement && target.tagName === "BUTTON",
        ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey,
      });
      if (!action) return;
      if (e.key === " ") e.preventDefault(); // Space would otherwise scroll the page
      dispatch(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, derived, dispatch]);

  if (devCrash === "app") return <DevBoom />;

  return (
    <>
      {/* Black while a chunk is on its way: the page behind is black too, so nothing flashes. */}
      <Suspense fallback={null}>{state.entered && <Room locked={state.layer !== "main"} />}</Suspense>
      {/* One boundary per screen layer: a bug in one screen shows the crash card instead of a blank page. Keyed so changing layer starts clean. */}
      <ErrorBoundary key={state.layer}>
        <Suspense fallback={null}>{devCrash === "screen" ? <DevBoom /> : state.layer === "splash" ? <Splash /> : <LayerView layer={state.layer} />}</Suspense>
      </ErrorBoundary>
      <SessionClock />
      <IdleVoice />
      <TabTitle />
      <StorageNotice />
      {state.entered && <Banner />}
      {state.demo && <DemoTag />}
      {dev && <DevPanel onCrash={setDevCrash} />}
    </>
  );
}
