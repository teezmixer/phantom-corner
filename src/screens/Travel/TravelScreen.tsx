import { useEffect, useReducer } from "react";
import { imagesOf } from "@/content/assets";
import { ui } from "@/content/copy";
import { getLocation } from "@/content/registry";
import { initialTravel, preload, travelStep, travelTimings } from "@/domain/travel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { loadImage } from "@/lib/loadImage";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/StoreProvider";

/**
 * Travel (spec §3.10): a red wipe covers the screen, the destination's title card is held on black while its images load, a
 * wipe reveals the room, and the sign settles (the location widget does that last part). The sequence is the pure machine in
 * domain/travel.ts; this component only feeds it its timers and the images, and draws the phase it is in.
 * With reduced motion the two wipes are 100 ms cuts. The card still holds: the next place loads inside it.
 * DECISION: D-33 — the colours of the wipe and card and the moving line are placeholders until Ares draws travel.
 */
export function TravelScreen() {
  const { state, dispatch } = useStore();
  const reduced = useReducedMotion();
  const [travel, send] = useReducer(travelStep, initialTravel);
  const target = state.travelTo ? getLocation(state.travelTo) : null;
  const targetId = target?.id;

  // The next place's images start loading at once and are done when they are done: the title card waits for them.
  useEffect(() => {
    if (!targetId) return;
    let live = true;
    void preload(imagesOf(getLocation(targetId)), loadImage).then(() => { if (live) send({ type: "ASSETS_READY" }); });
    return () => { live = false; };
  }, [targetId]);

  // Each phase's own timer, and what each phase does to the app.
  const phase = travel.phase;
  useEffect(() => {
    const t = travelTimings(reduced);
    if (phase === "covering") { const id = setTimeout(() => send({ type: "COVERED" }), t.cover); return () => clearTimeout(id); }
    if (phase === "title") { const id = setTimeout(() => send({ type: "HOLD_ELAPSED" }), t.hold); return () => clearTimeout(id); }
    if (phase === "revealing") {
      dispatch({ type: "TRAVEL_REVEAL" }); // the room behind the card becomes the destination, so the wipe uncovers it
      const id = setTimeout(() => send({ type: "REVEALED" }), t.reveal);
      return () => clearTimeout(id);
    }
    dispatch({ type: "ARRIVE" });
  }, [phase, reduced, dispatch]);

  // When travel is over the room is live again, but focus was lost with the map: put it back where the trip began. That is the map
  // button; if the HUD is hidden (the map opens with N all the same) the menu button is gone too, so the "Show UI" button is next.
  useEffect(() => () => {
    const byLabel = (label: string) => document.querySelector<HTMLElement>(`[aria-label="${label}"]`);
    const showUi = [...document.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent?.trim() === ui.showUi);
    (byLabel(ui.bar.map) ?? byLabel(ui.bar.menu) ?? showUi)?.focus();
  }, []);

  const waitingLong = phase === "title" && travel.holdElapsed && !travel.assetsReady;
  return (
    <div role="status" aria-live="polite" data-phase={phase} className="fixed inset-0 z-50 overflow-hidden font-body-primary text-white">
      {phase === "covering" && <div className={cn("absolute inset-0 bg-redbright", !reduced && "motion-safe:animate-travel-cover")} />}
      {(phase === "title" || phase === "revealing") && (
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black", phase === "revealing" && !reduced && "motion-safe:animate-travel-reveal")}>
          <p className="font-display-hero text-6xl">{target?.name ?? "…"}</p>
          <p className="text-greylight">{target?.register}</p>
          {/* If the images are slow the card stays, and a line keeps moving so it does not look stuck (spec §3.10). */}
          {waitingLong && <div aria-hidden="true" className="mt-6 h-1 w-48 overflow-hidden bg-greydark"><div className={cn("h-full w-full bg-redbright", !reduced && "motion-safe:animate-travel-motif")} /></div>}
        </div>
      )}
    </div>
  );
}
