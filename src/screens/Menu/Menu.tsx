import { useEffect, useRef } from "react";
import { widgets } from "@/content/copy";
import { useAudio } from "@/audio/AudioProvider";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/** How far each label rests from level, so the list reads as signs pinned at angles rather than a form (spec §3.7). */
const TILTS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "1deg"] as const;

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
  const go = (layer: "main" | "map" | "profile" | "settings") => dispatch({ type: "SET_LAYER", layer });
  const items: { label: string; run: () => void; available?: boolean }[] = [
    { label: "STUDY", run: () => { if (state.timer.status !== "running" && state.timer.status !== "paused") dispatch({ type: "START_SESSION", now: Date.now() }); else go("main"); } },
    { label: "MAP", run: () => go("map"), available: derived.mapOpen },
    { label: "MESSAGES", run: () => { dispatch({ type: "SET_PHONE", open: true }); go("main"); } },
    { label: "PROFILE", run: () => go("profile") },
    { label: "SETTINGS", run: () => go("settings") },
    { label: "CLOSE", run: () => go("main") },
  ];

  // Arrow keys move the highlight. Attached to the list itself (not a React prop) because a list is not an interactive
  // element; the buttons inside it are, and key events reach the list from them.
  const list = useRef<HTMLUListElement>(null);
  const count = items.length;
  const { play } = audio;
  useEffect(() => {
    const node = list.current;
    if (!node) return;
    const move = (e: KeyboardEvent) => {
      const last = count - 1;
      const at = buttons.current.findIndex((b) => b === document.activeElement);
      const to = e.key === "ArrowDown" ? (at >= last ? 0 : at + 1) : e.key === "ArrowUp" ? (at <= 0 ? last : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
      if (to === null) return;
      e.preventDefault();
      buttons.current[to]?.focus();
      if (to !== at) play("select");
    };
    node.addEventListener("keydown", move);
    return () => node.removeEventListener("keydown", move);
  }, [count, play]);

  return (
    <Overlay title="Hideout" closable={false} className="motion-safe:animate-menu-wipe motion-reduce:animate-menu-cut">
      <ul ref={list} className="flex flex-col gap-2">
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
                onMouseEnter={(e) => e.currentTarget.focus()}
                className={cn(buttonClass, "w-full font-display-hero text-2xl focus-visible:bg-redbright", notYet && "cursor-not-allowed border-dashed text-greylight hover:bg-black focus-visible:bg-black")}
              >
                <span className={notYet ? "line-through" : ""}>{item.label}</span>
                {notYet && <span className="ml-3 text-sm no-underline">{widgets.notYet}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </Overlay>
  );
}
