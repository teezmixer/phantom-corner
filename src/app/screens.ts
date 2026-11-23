import { lazy, type ComponentType } from "react";
import type { Layer } from "@/state/store";
import { TravelScreen } from "@/screens/Travel/TravelScreen";

/**
 * The heavy pieces and the rarely opened screens are their own chunks (spec §4.15: small first load): the room (the HUD, the
 * TV and the motion library behind it), the summary (the calendar), Settings, Profile, the break and session-end screens and
 * the three pages, the menu and the map. Only the travel card stays in the entry on purpose: it is timed to the millisecond
 * and must never wait on the network. `prefetchScreens` fetches every chunk once the
 * page is idle, so none of them waits when first needed.
 */
const loaders = {
  menu: () => import("@/screens/Menu/Menu").then((m) => ({ default: m.Menu })),
  map: () => import("@/screens/Map/MapScreen").then((m) => ({ default: m.MapScreen })),
  room: () => import("./MainScreen").then((m) => ({ default: m.default })),
  summary: () => import("@/screens/Summary/SummaryScreen").then((m) => ({ default: m.SummaryScreen })),
  settings: () => import("@/screens/Settings/SettingsScreen").then((m) => ({ default: m.SettingsScreen })),
  profile: () => import("@/screens/Profile/ProfileScreen").then((m) => ({ default: m.ProfileScreen })),
  choice: () => import("@/screens/SessionEnd/SessionEndScreen").then((m) => ({ default: m.SessionEndScreen })),
  break: () => import("@/screens/Break/BreakScreen").then((m) => ({ default: m.BreakScreen })),
  pages: () => import("@/screens/Pages/Pages"),
};

export const Room: ComponentType<{ locked?: boolean }> = lazy(loaders.room);
const page = (name: "AboutScreen" | "CreditsScreen" | "PrivacyScreen") => lazy(() => loaders.pages().then((m) => ({ default: m[name] })));

export const LAYER_SCREENS: Partial<Record<Layer, ComponentType>> = {
  menu: lazy(loaders.menu),
  map: lazy(loaders.map),
  travel: TravelScreen,
  settings: lazy(loaders.settings),
  profile: lazy(loaders.profile),
  summary: lazy(loaders.summary),
  choice: lazy(loaders.choice),
  break: lazy(loaders.break),
  about: page("AboutScreen"),
  credits: page("CreditsScreen"),
  privacy: page("PrivacyScreen"),
};

/** Starts fetching every chunk, once, when the browser is idle. A failed fetch is ignored here; it is retried when the screen is needed. */
export function prefetchScreens(): void {
  const run = () => { for (const load of Object.values(loaders)) void load().catch(() => {}); };
  if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}
