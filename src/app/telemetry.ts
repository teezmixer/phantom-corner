/**
 * The analytics switch, honoured at SEND time (spec §4.16: the off switch is honoured before anything is sent).
 * Turning the switch off in Settings cannot unload a script that is already running, but its events are dropped here.
 * A module variable (not React state) so a script's long-lived callback always sees the current choice.
 */
let allowed = true;

export const OPT_OUT_KEY = "pc-optout"; // deliberately NOT prefixed "pc:" — Delete my data keeps this one choice

export function setAnalyticsAllowed(on: boolean): void {
  allowed = on;
}

/** `beforeSend` for Vercel Analytics and Speed Insights: pass the event on only while analytics is on. */
export function analyticsGate<T>(event: T): T | null {
  return allowed ? event : null;
}

/** Remember (or forget) the opt-out so it survives "Delete my data" and applies from the very first load. */
export function rememberOptOut(optedOut: boolean, storage: Pick<Storage, "setItem" | "removeItem"> = window.localStorage): void {
  try {
    if (optedOut) storage.setItem(OPT_OUT_KEY, "1");
    else storage.removeItem(OPT_OUT_KEY);
  } catch { /* storage blocked: the choice still holds for this visit */ }
}

export function readOptOut(storage: Pick<Storage, "getItem"> = window.localStorage): boolean {
  try { return storage.getItem(OPT_OUT_KEY) === "1"; } catch { return false; }
}
