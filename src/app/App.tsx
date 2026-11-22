import { useEffect, type ReactNode } from "react";
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

/** Layers Esc may close (spec §3.6: Esc closes any layer). Moments that need a choice are not dismissable. */
const DISMISSABLE: Layer[] = ["menu", "map", "settings", "profile", "about", "credits", "privacy"];

/** Composition root: the room is always underneath once entered; one `layer` decides what sits on top. */
export function App({ dev }: { dev: boolean }) {
  const { state, dispatch } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && DISMISSABLE.includes(state.layer)) dispatch({ type: "CLOSE_LAYER" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.layer, dispatch]);

  return (
    <>
      {state.entered && <MainScreen />}
      {LAYERS[state.layer]?.()}
      {dev && <DevPanel />}
    </>
  );
}
