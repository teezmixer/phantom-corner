import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { ui } from "@/content/copy";
import { cn } from "@/lib/utils";
import { useStore } from "@/state/StoreProvider";

/**
 * Shared full-screen layer for wireframe screens. Token-styled with a small "placeholder" marker.
 * DECISION: placeholder-screen-look — arrangement is the plainest that works; the look is Ares's call.
 * Focus moves into the layer on open; a full focus trap and focus return come with the menu in M6.
 */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Overlay({ title, children, closable = true, className }: { title: string; children: ReactNode; closable?: boolean; className?: string }) {
  const { state, dispatch } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  // Focus moves into the layer on open and returns to where it was on close.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => before?.focus?.();
  }, []);

  // Keep Tab inside the dialog (the room behind it is inert; this covers the dialog's own edges).
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    node.addEventListener("keydown", trap);
    return () => node.removeEventListener("keydown", trap);
  }, []);

  return (
    // The right gutter keeps the TV clear: it is never covered (spec §4.8). Before entering there is no TV.
    <div role="dialog" aria-modal="true" aria-label={title} ref={ref} className={cn("fixed inset-0 z-40 flex items-center justify-center bg-black/90 p-4 font-body-primary text-white", state.entered && "pr-[calc(200px+5rem)]")}>
      <div className={cn("relative flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto border-2 border-white bg-black p-6", className)}>
        <header className="flex items-start justify-between gap-4">
          <h2 className="font-display-hero text-4xl leading-none text-redbright">{title}</h2>
          <span className="flex items-center gap-3">
            <span className="border border-greymid px-1 text-[10px] uppercase text-greylight">{ui.placeholderMarker}</span>
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

export const buttonClass = "border-2 border-white bg-black px-4 py-2 text-left hover:bg-redbright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentteal disabled:cursor-not-allowed disabled:border-dashed disabled:text-greylight disabled:hover:bg-black";
