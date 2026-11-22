/**
 * Timer display pieces adapted from Cult UI `timer` (MIT, Nolly Studio — see credits).
 * Only the presentational TimerRoot / TimerIcon / TimerDisplay are kept. Cult UI's own useTimer counts elapsed
 * time up with performance.now(); Phantom Corner counts DOWN from a timestamp (domain/timer.ts), so the
 * time string is passed in. Demo shadows and colours were removed; surfaces use tokens only.
 */
import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const TimerRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} role="timer" aria-atomic="true" className={cn("inline-flex items-center gap-2 border-2 border-border bg-background px-2 text-foreground", className)} {...props}>
      {children}
    </div>
  ),
);
TimerRoot.displayName = "TimerRoot";

/** Upstream spins the icon while running; here it stays still — the room is calm while the timer runs (spec Part 1). */
export function TimerIcon({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("size-5", className)}>
      <Clock className="size-full" />
    </span>
  );
}

export function TimerDisplay({ time, className }: { time: string; className?: string }) {
  return <span className={cn("tabular-nums tracking-tight", className)}>{time}</span>;
}
