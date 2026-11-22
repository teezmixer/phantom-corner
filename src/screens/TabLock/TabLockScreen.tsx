import { useEffect, useRef } from "react";
import { widgets } from "@/content/copy";

/** Shown in a second tab: only one tab owns the session (spec §3.11). Taking over reloads from the saved state. */
export function TabLockScreen({ onTakeover }: { onTakeover: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <div role="alertdialog" aria-label={widgets.secondTab} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black px-6 text-center font-body-primary text-white">
      <p className="font-display-hero text-4xl leading-tight">{widgets.secondTab}</p>
      <button type="button" ref={button} onClick={onTakeover} className="border-2 border-white bg-redbright px-6 py-3 text-lg hover:bg-white hover:text-redbright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accentteal">
        {widgets.secondTabTakeover}
      </button>
    </div>
  );
}
