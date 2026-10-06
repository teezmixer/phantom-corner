# Decision log

## M1: fixed 1440x900 stage, scaled to the viewport (not fluid layout)
- **Decision:** every widget is placed by pixel coordinates on a 1440x900 "stage".
  `MainScreen` scales the whole stage with CSS `transform: scale(...)` using
  `Math.min(innerWidth/1440, innerHeight/900)` and centers it. Leftover space is
  black letterbox bars (`main` is `#000`).
- **Why:** the art and all widget positions come from a fixed design. A fluid layout would
  mean re-deriving every position per breakpoint. `Math.max` (cover) crops; `Math.min` (contain) never clips.
- **Fonts:** loaded with `@font-face` from `src/fonts/` (see `index.css`, `gate/gate.css`), not a CDN.
- **Rule:** delete a grey placeholder box from `MainScreen` as soon as its real widget ships.
