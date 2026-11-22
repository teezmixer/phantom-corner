import type { ReactNode } from "react";
import { ui } from "@/content/copy";
import { cn } from "@/lib/utils";

/**
 * Plain token-styled surface shared by HUD widgets until Ares's drawn art exists (D-21).
 * DECISION: placeholder-slab-look — the look is a placeholder; behaviour is real. A tiny marker says so.
 */
export function Slab({ className, children, label }: { className?: string; children: ReactNode; label?: string }) {
  return (
    <div className={cn("pointer-events-auto relative border-2 border-white bg-black font-body-primary text-white", className)} role={label ? "group" : undefined} aria-label={label}>
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-3.5 right-0 text-[8px] uppercase leading-none text-greylight">{ui.placeholderMarker}</span>
    </div>
  );
}
