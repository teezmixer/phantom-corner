---
version: alpha
name: Phantom Corner
description: >
  Design-system tokens for Phantom Corner, a Persona 5 fan-made study room. Transcribed, not invented:
  colours and type come from the Figma variable export recovered from git history (commits 4129f5e,
  df6a002) plus the BUILT mobile-gate tokens; motion comes from spec §3.10. The Figma file itself
  currently has no variables (decision D-01). Runtime source of truth: src/styles/tokens.css.
omitted:
  - section: rounded
    reason: "No radius token exists yet; shadcn --radius is 0px as a placeholder (decision D-18)."
  - section: components
    reason: "Component looks are Ares's decision; prototype components are token-styled wireframes."
---

# Phantom Corner design system

## Overview

A Persona 5–style HUD laid over a calm study scene. One screen, always. Loud on arrival and completion,
calm while the timer runs (spec Part 1). Competence, not stimulation.

This file records **only** what Ares has defined. Anything not listed here is a placeholder and is
logged in `docs/build/decisions.md`. No colour, font, gradient or shadow may be used in code unless it
is a token below.

## Colors

Black and white slabs with three reds; a small set of accents. Spec §3.7 assigns **red to selection**
and **teal to accent and focus**.

```yaml
colors:
  black: "rgb(0 0 0)"
  white: "rgb(255 255 255)"
  greydark: "rgb(55 55 55)"
  greylight: "rgb(207 207 207)"
  greymid: "rgb(97 96 101)"       # D-15: export had rgb(123 123 123)
  redbright: "rgb(221 5 7)"       # D-15: export had rgb(254 0 0)
  redmid: "rgb(187 0 1)"
  reddeep: "rgb(105 1 2)"
  accentblue: "rgb(14 98 237)"
  accentgold: "rgb(218 173 2)"
  accentmint: "rgb(233 252 225)"
  accentpink: "rgb(250 133 214)"
  accentteal: "rgb(23 228 245)"
  accentyellow: "rgb(255 251 30)"
```

**shadcn role mapping** (`src/styles/shadcn.css`, decision D-19): background/card/popover → black,
foreground → white, primary → redbright, accent and ring → accentteal, secondary/muted → greydark,
muted-foreground → greylight, border/input → greymid, destructive → redmid.

Contrast (spec §4.12): redbright on black ≈ 4.1:1, large text only; white on redbright ≈ 5.1:1.

## Typography

Seven roles from the export. Faces marked *not loaded* have no `@font-face` yet and fall back
(decision D-16); the commercial font files in `public/fonts/` are untouched (pre-flight P5).

```yaml
typography:
  body-primary:
    fontFamily: Optima Nova LT Black
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-secondary:
    fontFamily: Optima Nova LT Black
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  display-hero:
    fontFamily: Expose
    fontSize: 64px
    fontWeight: 400
    lineHeight: 72px
  display-title:
    fontFamily: Doctor Punk
    fontSize: 48px
    fontWeight: 400
    lineHeight: 56px
  display-label:
    fontFamily: Bubblegum Superstar   # not loaded → Expose
    fontSize: 24px
    fontWeight: 400
    lineHeight: 32px
  hud-small:
    fontFamily: Helvetica Now Display
    fontSize: 11px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 5.5px
  hud-timer:
    fontFamily: Earwig Factory         # not loaded → Expose
    fontSize: 48px
    fontWeight: 400
    lineHeight: 52px
```

Loaded faces: Optima Nova LT Black (regular, italic) via `src/index.css`; Expose, Doctor Punk and
Helvetica Now Display (700, 800 italic) via `src/gate/gate.css`.

## Layout

The HUD is designed on a **1440×900 reference frame** (Figma `4:2521`). Widgets sit in four corner
groups pinned to the real screen corners and scaled by `min(3, innerWidth/1440, innerHeight/900)`
(BUILT, `DECISIONS.md`). Slot positions are data: `docs/build/figma-main-screen.md` →
`src/hud/slots.ts`. Minimum supported window 1024×600 (spec §4.4).

```yaml
spacing:
  "04": 4px
  "08": 8px
  "12": 12px
  "16": 16px
  "24": 24px
```

The export's 32–96 steps were `0px` and are not carried over.

## Motion & Micro-interaction

Hard cuts and directional wipes, never crossfades. Animate only `transform`, `opacity` and
`clip-path`. Reduced motion turns wipes into 100 ms cuts and stops marquees (spec §3.10).

```yaml
motion:
  snap:            # hover, select, key press — PROPOSED
    duration: 120ms
  wipe:            # diagonal clip-path wipe, menu open — DECIDED
    duration: 200ms
  enter:           # slabs and labels, stagger 40–80ms — BUILT (gate-in)
    duration: 420ms
    timingFunction: cubic-bezier(.2,.9,.3,1)
  hold:            # big location sign on arrival — PROPOSED number
    duration: 900ms
  travel:          # wipe out, title card, wipe in; spec range 1.2–1.6s — PROPOSED
    duration: 1400ms
  reduced-cut:     # reduced-motion replacement for wipes
    duration: 100ms
```

Easing for snap, wipe, hold and travel is not specified; components use `enter`'s curve until Ares
defines one.

## Voice & Content Strategy

Characters speak; the app never does (spec §3.8). Sojiro dry and short; Morgana bossy and proud,
says "progress", never "data"; Joker two or three words; Ryuji loud and warm; Futaba lowercase;
Akechi formal with an edge. Banned: "Welcome back, {name}", "Get started", "Sign up", "Oops!",
"Something went wrong", "Awesome!", "Are you sure?", "Loading…". All strings live in content files
grouped by speaker.

## Do's and Don'ts

- **Do** use only the tokens above, through Tailwind utilities (`bg-redbright`, `font-hud-small`) or
  `var(--token)`.
- **Do** mark every placeholder look with `// DECISION: <id>` and log it.
- **Don't** add hex values, gradients, shadow colours or fonts. Tailwind's default palette is
  removed on purpose (`src/styles/theme.css`).
- **Don't** adopt Cult UI demo colours, Geist fonts, or any skill's palette or font pairing.
- **Don't** cover or hide the TV player (spec §4.8).
