import { useEffect, useRef } from "react";
import { Cat } from "@phosphor-icons/react";
import { Student } from "@phosphor-icons/react";
import { settings as settingsCopy, ui, widgets } from "@/content/copy";
import { useAudio } from "@/audio/AudioProvider";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/**
 * How far each label rests from level, so the list reads as signs pinned at angles rather than a form (spec §3.7).
 * Small enough, with the gap below, that no label's tilted box reaches the next one: a click always lands on the label
 * it is on (a test measures this).
 */
const TILTS = ["-1.5deg", "1deg", "-1deg", "1.5deg", "-1deg", "1deg"] as const;

/**
 * Hideout menu (spec §3.7). Opens with a diagonal clip-path wipe while the labels fly in at angles, one after another;
 * with reduced motion both become a single 100 ms cut. Arrow keys (and Home/End) move the highlight with a sound and wrap
 * around, Enter selects, Esc closes (the shared shortcut handler). Labels that are not built yet stay in the list, struck
 * through with a one-line "not yet"; they can be reached with the keyboard but do nothing.
 * DECISION: D-30 — the angles, the stagger and the wipe's slant are placeholders until Ares draws the menu.
 */
export function Menu() {
  const { state, derived, dispatch } = useStore();
  const audio = useAudio();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const illustrated = state.menuStyle === "illustrated";
  const go = (layer: "main" | "map" | "profile" | "settings") => dispatch({ type: "SET_LAYER", layer });
  const items: { label: string; run: () => void; available?: boolean }[] = [
    { label: ui.menu.study, run: () => { if (state.timer.status !== "running" && state.timer.status !== "paused") dispatch({ type: "START_SESSION", now: Date.now() }); else go("main"); } },
    { label: ui.menu.map, run: () => go("map"), available: derived.mapOpen },
    { label: ui.menu.messages, run: () => { dispatch({ type: "SET_PHONE", open: true }); go("main"); } },
    { label: ui.menu.profile, run: () => go("profile") },
    { label: ui.menu.settings, run: () => go("settings") },
    { label: ui.menu.close, run: () => go("main") },
  ];

  // Arrow keys move the highlight. The listener is on the document, not the list: after a click on the heading or the
  // panel padding nothing is focused and key events go to the page body, and the arrows must still work from there
  // (an arrow with nothing highlighted goes to the first or last label). The menu is a layer, so it is only mounted while
  // it is the one on screen; it has no text field to leave alone.
  const count = items.length;
  const { play } = audio;
  useEffect(() => {
    const move = (e: KeyboardEvent) => {
      const last = count - 1;
      const at = buttons.current.findIndex((b) => b === document.activeElement);
      const to = e.key === "ArrowDown" ? (at >= last ? 0 : at + 1) : e.key === "ArrowUp" ? (at <= 0 ? last : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
      if (to === null || e.altKey || e.ctrlKey || e.metaKey) return;
      // Only keys from inside the menu, or from nowhere in particular (the page body): a control elsewhere (the dev panel's
      // select, for one) keeps its own arrow keys.
      if (e.target instanceof Element && e.target !== document.body && !e.target.closest('[role="dialog"]')) return;
      e.preventDefault();
      buttons.current[to]?.focus();
      if (to !== at) play("select");
    };
    document.addEventListener("keydown", move);
    return () => document.removeEventListener("keydown", move);
  }, [count, play]);

  return (
    <Overlay title={ui.menu.title} closable={false} className="motion-safe:animate-menu-wipe motion-reduce:animate-menu-cut">
      <div className={cn(illustrated && "grid gap-4 sm:grid-cols-[11rem_1fr]")}>
      {illustrated && (
        // The illustrated style (spec §3.7): a slot for the drawn Student Ren, and Morgana's placeholder rising from the bag as
        // the menu opens. Both are placeholders until Ares draws them (D-36); only transform moves.
        <div className="relative hidden h-56 overflow-hidden border-2 border-dashed border-greymid sm:block" data-testid="menu-art">
          <div className="grid h-full place-items-center text-greymid" role="img" aria-label={settingsCopy.menuArtSlot}><Student size={72} /></div>
          <div role="img" aria-label={settingsCopy.menuMorgana} data-testid="morgana-peek" className="absolute bottom-0 right-2 grid size-16 place-items-center border-2 border-white border-b-0 bg-black text-white motion-safe:animate-morgana-peek motion-reduce:animate-menu-cut"><Cat size={40} /></div>
        </div>
      )}
      <ul className="flex flex-col gap-4">
        {items.map((item, i) => {
          const notYet = item.available === false;
          return (
            <li key={item.label} style={{ "--i": i, "--tilt": TILTS[i % TILTS.length], transform: "rotate(var(--tilt))" } as React.CSSProperties}
              className="motion-safe:animate-menu-label motion-safe:[animation-delay:calc(var(--i)*var(--motion-stagger))] motion-reduce:animate-menu-cut">
              <button
                type="button"
                ref={(el) => { buttons.current[i] = el; }}
                aria-disabled={notYet || undefined}
                onClick={() => { if (!notYet) item.run(); }}
                // Only real pointer movement moves the highlight: a menu that opens under a resting mouse must not steal it from the keyboard.
                onMouseMove={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.focus(); }}
                className={cn(buttonClass, "w-full font-display-hero text-2xl hover:bg-black focus:bg-redbright", notYet && "cursor-not-allowed border-dashed text-greylight focus:bg-black focus:outline-2 focus:outline-offset-2 focus:outline-accentteal")}
              >
                <span className={notYet ? "line-through" : ""}>{item.label}</span>
                {/* A real space between the two, so a screen reader says "MAP, Not yet." and not one run-on word. */}
                {notYet && <>{" "}<span className="ml-3 text-sm no-underline">{widgets.notYet}</span></>}
              </button>
            </li>
          );
        })}
      </ul>
      </div>
    </Overlay>
  );
}
