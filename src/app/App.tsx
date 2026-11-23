import { useEffect, type ReactNode } from "react";
import { morgana } from "@/content/copy";
import { BASE_TITLE, tabTitle } from "@/domain/title";
import { useNow } from "@/hooks/useNow";
import { isTypingTarget, shortcutAction } from "@/hooks/shortcuts";
import { useStore } from "@/state/StoreProvider";
import { onboardingRunning, type Layer } from "@/state/store";
import { BreakScreen } from "@/screens/Break/BreakScreen";
import { MapScreen } from "@/screens/Map/MapScreen";
import { Menu } from "@/screens/Menu/Menu";
import { AboutScreen, CreditsScreen, PrivacyScreen } from "@/screens/Pages/Pages";
import { ProfileScreen } from "@/screens/Profile/ProfileScreen";
import { SessionEndScreen } from "@/screens/SessionEnd/SessionEndScreen";
import { SettingsScreen } from "@/screens/Settings/SettingsScreen";
import { Splash } from "@/screens/Splash/Splash";
import { SummaryScreen } from "@/screens/Summary/SummaryScreen";
import { TravelScreen } from "@/screens/Travel/TravelScreen";
import { Banner } from "./Banner";
import { DevPanel } from "./DevPanel";
import MainScreen from "./MainScreen";

const LAYERS: Partial<Record<Layer, () => ReactNode>> = {
  splash: () => <Splash />,
  menu: () => <Menu />,
  map: () => <MapScreen />,
  travel: () => <TravelScreen />,
  settings: () => <SettingsScreen />,
  profile: () => <ProfileScreen />,
  summary: () => <SummaryScreen />,
  choice: () => <SessionEndScreen />,
  break: () => <BreakScreen />,
  about: () => <AboutScreen />,
  credits: () => <CreditsScreen />,
  privacy: () => <PrivacyScreen />,
};

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
export function App({ dev }: { dev: boolean }) {
  const { state, derived, dispatch } = useStore();

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

  return (
    <>
      {state.entered && <MainScreen locked={state.layer !== "main"} />}
      {LAYERS[state.layer]?.()}
      <SessionClock />
      <IdleVoice />
      <TabTitle />
      <StorageNotice />
      {state.entered && <Banner />}
      {dev && <DevPanel />}
    </>
  );
}
