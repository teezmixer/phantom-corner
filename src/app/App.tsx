import { useEffect, type ReactNode } from "react";
import { isTypingTarget, shortcutAction } from "@/hooks/shortcuts";
import { useStore } from "@/state/StoreProvider";
import type { Layer } from "@/state/store";
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
      {/* The room is inert while a screen is open, so keyboard focus and assistive tech stay in the dialog. */}
      {state.entered && <div className="contents" inert={state.layer !== "main"}><MainScreen /></div>}
      {LAYERS[state.layer]?.()}
      {dev && <DevPanel />}
    </>
  );
}
