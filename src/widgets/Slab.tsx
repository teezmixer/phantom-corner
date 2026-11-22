import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Plain token-styled surface shared by HUD widgets until Ares's drawn art exists (D-21).
 * DECISION: placeholder-slab-look — the look is a placeholder; behaviour is real.
 */
export function Slab({ className, children, label }: { className?: string; children: ReactNode; label?: string }) {
  return (
    <div className={cn("pointer-events-auto border-2 border-white bg-black font-body-primary text-white", className)} role={label ? "group" : undefined} aria-label={label}>
      {children}
    </div>
  );
}
