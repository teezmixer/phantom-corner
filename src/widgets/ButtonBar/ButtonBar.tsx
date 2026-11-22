import { EyeSlash, List, MapTrifold } from "@phosphor-icons/react";
import { Dock, DockCard } from "@/components/ui/dock";
import { useStore } from "@/state/StoreProvider";

const Key = ({ k }: { k: string }) => <kbd className="font-body-primary text-[10px] leading-none">{k}</kbd>;

/**
 * Bottom bar: Cult UI dock (magnify on hover, reduced-motion safe) with keycap hints.
 * The map button only exists once the user has earned it (spec §3.4). Keyboard shortcuts are wired in M5.
 */
export function ButtonBar() {
  const { derived, dispatch } = useStore();
  return (
    <nav aria-label="Main controls" className="pointer-events-auto">
      <Dock className="h-12 gap-2 p-1">
        <DockCard id="0" label="Menu (M)" onSelect={() => dispatch({ type: "SET_LAYER", layer: "menu" })}>
          <span className="flex flex-col items-center gap-0.5"><List size={16} /><Key k="M" /></span>
        </DockCard>
        {derived.mapOpen && (
          <DockCard id="1" label="Map (N)" onSelect={() => dispatch({ type: "SET_LAYER", layer: "map" })}>
            <span className="flex flex-col items-center gap-0.5"><MapTrifold size={16} /><Key k="N" /></span>
          </DockCard>
        )}
        <DockCard id="2" label="Hide UI (H)" onSelect={() => dispatch({ type: "TOGGLE_HUD" })}>
          <span className="flex flex-col items-center gap-0.5"><EyeSlash size={16} /><Key k="H" /></span>
        </DockCard>
      </Dock>
    </nav>
  );
}
