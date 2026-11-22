"use client"

/**
 * Progress bar for async flows and inline status (pairs with polished toast / notification).
 * Determinate fill uses `scaleX` (transform) — not animated `width`. Indeterminate uses a
 * sliding gradient strip. Styling aligns with {@link HaloSegmented} frosted + rim chrome.
 */
import { useMemo, type ComponentProps, type ReactNode } from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

/** Matches `layoutSpring` in `halo-button.tsx` / `halo-segmented.tsx`. */
const layoutSpring = {
  type: "spring" as const,
  bounce: 0.12,
  damping: 34,
  stiffness: 420,
}

function IndeterminateBar({
  className,
  reduceMotion,
}: {
  className?: string
  reduceMotion: boolean
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <motion.div
        animate={
          reduceMotion
            ? { x: "0%" }
            : {
                x: ["-45%", "145%"],
              }
        }
        aria-hidden
        className="absolute inset-y-0 left-0 h-full w-2/5 bg-primary"
        style={{ willChange: reduceMotion ? undefined : "transform" }}
        transition={{
          duration: reduceMotion ? 0.01 : 1.15,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
        }}
      />
    </div>
  )
}

export interface HaloProgressProps
  extends Omit<ProgressPrimitive.Root.Props, "children"> {
  /** Optional label wired to Base UI progress label + `aria-labelledby`. */
  label?: ReactNode
  /** Show formatted percentage from Base UI (`tabular-nums`). */
  showValue?: boolean
  trackClassName?: string
  indicatorClassName?: string
}

export function HaloProgress({
  className,
  label,
  showValue,
  trackClassName,
  indicatorClassName,
  value,
  min = 0,
  max = 100,
  ...rootProps
}: HaloProgressProps) {
  const reduceMotion = useReducedMotion() ?? false
  const isIndeterminate = value === null

  const pct = useMemo(() => {
    if (value === null || !Number.isFinite(value)) {
      return 0
    }
    const span = max - min
    if (span <= 0) {
      return 0
    }
    return Math.min(1, Math.max(0, (value - min) / span))
  }, [value, min, max])

  return (
    <ProgressPrimitive.Root
      className={cn("flex w-full min-w-[8rem] flex-wrap gap-2", className)}
      max={max}
      min={min}
      value={value}
      {...rootProps}
    >
      {(label != null || showValue) && (
        <div className="flex w-full items-baseline justify-between gap-3">
          {label == null ? (
            <span className="sr-only">Progress</span>
          ) : (
            <ProgressPrimitive.Label className="font-medium text-foreground text-xs/relaxed">
              {label}
            </ProgressPrimitive.Label>
          )}
          {showValue ? (
            <ProgressPrimitive.Value className="text-muted-foreground text-xs/relaxed tabular-nums" />
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "relative w-full p-px",
          !(label || showValue) && "min-w-[8rem]"
        )}
      >
        <ProgressPrimitive.Track
          className={cn(
            "relative h-2 w-full overflow-hidden border border-border bg-muted",
            trackClassName
          )}
        >
          {isIndeterminate ? (
            <IndeterminateBar reduceMotion={reduceMotion} />
          ) : (
            <motion.div
              animate={{ scaleX: pct }}
              aria-hidden
              className={cn(
                "absolute inset-y-0 left-0 h-full w-full origin-left",
                "bg-primary",
                indicatorClassName
              )}
              initial={false}
              style={{ willChange: reduceMotion ? undefined : "transform" }}
              transition={reduceMotion ? { duration: 0 } : { ...layoutSpring }}
            />
          )}
        </ProgressPrimitive.Track>
      </div>
    </ProgressPrimitive.Root>
  )
}

export type HaloProgressLabelProps = ComponentProps<
  typeof ProgressPrimitive.Label
>
export type HaloProgressValueProps = ComponentProps<
  typeof ProgressPrimitive.Value
>
