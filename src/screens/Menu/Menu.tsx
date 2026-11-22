import { widgets } from "@/content/copy";
import { useStore } from "@/state/StoreProvider";
import { Overlay, buttonClass } from "../Overlay";

/**
 * Hideout menu — the working wireframe. Kinetic labels, diagonal wipes, keyboard navigation and sound arrive in M6.
 * Labels that are not built yet show the "not yet" state (spec §3.7).
 */
export function Menu() {
  const { derived, dispatch } = useStore();
  const go = (layer: "main" | "map" | "profile" | "settings") => dispatch({ type: "SET_LAYER", layer });
  const items: { label: string; run: () => void; available?: boolean }[] = [
    { label: "STUDY", run: () => go("main") },
    { label: "MAP", run: () => go("map"), available: derived.mapOpen },
    { label: "MESSAGES", run: () => { dispatch({ type: "SET_PHONE", open: true }); go("main"); } },
    { label: "PROFILE", run: () => go("profile") },
    { label: "SETTINGS", run: () => go("settings") },
    { label: "CLOSE", run: () => go("main") },
  ];
  return (
    <Overlay title="Hideout" closable={false}>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.label}>
            <button type="button" onClick={item.run} disabled={item.available === false} className={`${buttonClass} w-full font-display-label text-2xl`}>
              <span className={item.available === false ? "line-through" : ""}>{item.label}</span>
              {item.available === false && <span className="ml-3 text-sm no-underline">{widgets.notYet}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}
