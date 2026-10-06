# Decision log

## M1 (revised): full-bleed background + HUD anchored to the screen corners
- **Supersedes:** the first M1 approach (fixed 1440x900 stage, letterboxed).
- **Decision:** the background fills the whole screen (`object-cover`, no bars; will become video).
  Widgets do NOT live on the image. They sit in four corner groups (`tl`/`tr`/`bl`/`br`) pinned to the
  real screen corners, so e.g. the location sign is always bottom-right of the user's screen.
- **Scaling:** each corner group is a 1440x900 reference box scaled by
  `min(innerWidth/1440, innerHeight/900)` from its own corner, so the HUD keeps its proportions and never clips.
  Cropping the background can never hide a widget.
- **Future:** moving/hiding widgets = changing which corner/offset a widget uses, not re-doing the layout.
- **Fonts:** loaded with `@font-face` from `src/fonts/` (see `index.css`, `gate/gate.css`), not a CDN.
- **Rule:** delete a grey placeholder as soon as its real widget ships.
