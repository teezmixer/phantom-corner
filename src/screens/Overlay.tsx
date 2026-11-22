import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/StoreProvider";

/**
 * Shared full-screen layer for wireframe screens. Token-styled with a small "placeholder" marker.
 * DECISION: placeholder-screen-look — arrangement is the plainest that works; the look is Ares's call.
 * Focus moves into the layer on open; a full focus trap and focus return come with the menu in M6.
 */
export function Overlay({ title, children, closable = true, className }: { title: string; children: ReactNode; closable?: boolean; className?: string }) {
  const { dispatch } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button, [href], input, select")?.focus();
  }, []);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} ref={ref} className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 font-body-primary text-white">
      <div className={cn("relative flex max-h-[85vh] w-[min(92vw,44rem)] flex-col gap-4 overflow-y-auto border-2 border-white bg-black p-6", className)}>
        <header className="flex items-start justify-between gap-4">
          <h2 className="font-display-title text-4xl leading-none text-redbright">{title}</h2>
          <span className="flex items-center gap-3">
            <span className="border border-greymid px-1 text-[10px] uppercase text-greylight">placeholder</span>
            {closable && (
              <button type="button" aria-label="Close" onClick={() => dispatch({ type: "CLOSE_LAYER" })} className="hover:text-redbright focus-visible:outline-2 focus-visible:outline-accentteal"><X size={24} /></button>
            )}
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}

export const buttonClass = "border-2 border-white bg-black px-4 py-2 text-left hover:bg-redbright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentteal disabled:cursor-not-allowed disabled:text-greymid disabled:hover:bg-black";
