import React from "react";

// Static "open this on a computer" gate. No state, no logic, no width detection.
// Show/hide is handled outside: see GateRoute.tsx and isPhoneBrowser.ts.
// Colors and fonts come from CSS variables via tailwind.config.js (see styles.css).
export default function MobileGate(): React.JSX.Element {
  return (
    <main className="relative flex h-full min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-black px-6 pb-4 pt-3 text-white">
      {/* Background pattern: dense overlapping nested stars in black, white and grey, no gaps (SVG, flat) */}
      <svg aria-hidden="true" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full bg-white">
        <defs>
          <symbol id="star-a" overflow="visible">
            <polygon points="0.0,-50.0 12.9,-17.8 47.6,-15.5 20.9,6.8 29.4,40.5 0.0,22.0 -29.4,40.5 -20.9,6.8 -47.6,-15.5 -12.9,-17.8" className="fill-black" />
            <polygon points="0.0,-44.5 11.5,-15.8 42.3,-13.8 18.6,6.1 26.2,36.0 0.0,19.6 -26.2,36.0 -18.6,6.1 -42.3,-13.8 -11.5,-15.8" className="fill-white" />
            <polygon points="0.0,-39.0 10.1,-13.9 37.1,-12.1 16.3,5.3 22.9,31.6 0.0,17.2 -22.9,31.6 -16.3,5.3 -37.1,-12.1 -10.1,-13.9" className="fill-black" />
            <polygon points="0.0,-33.5 8.7,-11.9 31.9,-10.4 14.0,4.6 19.7,27.1 0.0,14.7 -19.7,27.1 -14.0,4.6 -31.9,-10.4 -8.7,-11.9" className="fill-white" />
            <polygon points="0.0,-28.0 7.2,-10.0 26.6,-8.7 11.7,3.8 16.5,22.7 0.0,12.3 -16.5,22.7 -11.7,3.8 -26.6,-8.7 -7.2,-10.0" className="fill-black" />
            <polygon points="0.0,-22.5 5.8,-8.0 21.4,-7.0 9.4,3.1 13.2,18.2 0.0,9.9 -13.2,18.2 -9.4,3.1 -21.4,-7.0 -5.8,-8.0" className="fill-white" />
            <polygon points="0.0,-17.0 4.4,-6.1 16.2,-5.3 7.1,2.3 10.0,13.8 0.0,7.5 -10.0,13.8 -7.1,2.3 -16.2,-5.3 -4.4,-6.1" className="fill-black" />
            <polygon points="0.0,-11.5 3.0,-4.1 10.9,-3.6 4.8,1.6 6.8,9.3 0.0,5.1 -6.8,9.3 -4.8,1.6 -10.9,-3.6 -3.0,-4.1" className="fill-white" />
            <polygon points="0.0,-6.0 1.6,-2.1 5.7,-1.9 2.5,0.8 3.5,4.9 0.0,2.6 -3.5,4.9 -2.5,0.8 -5.7,-1.9 -1.6,-2.1" className="fill-black" />
          </symbol>
          <symbol id="star-b" overflow="visible">
            <polygon points="0.0,-50.0 12.9,-17.8 47.6,-15.5 20.9,6.8 29.4,40.5 0.0,22.0 -29.4,40.5 -20.9,6.8 -47.6,-15.5 -12.9,-17.8" className="fill-greymid" />
            <polygon points="0.0,-44.5 11.5,-15.8 42.3,-13.8 18.6,6.1 26.2,36.0 0.0,19.6 -26.2,36.0 -18.6,6.1 -42.3,-13.8 -11.5,-15.8" className="fill-white" />
            <polygon points="0.0,-39.0 10.1,-13.9 37.1,-12.1 16.3,5.3 22.9,31.6 0.0,17.2 -22.9,31.6 -16.3,5.3 -37.1,-12.1 -10.1,-13.9" className="fill-greymid" />
            <polygon points="0.0,-33.5 8.7,-11.9 31.9,-10.4 14.0,4.6 19.7,27.1 0.0,14.7 -19.7,27.1 -14.0,4.6 -31.9,-10.4 -8.7,-11.9" className="fill-white" />
            <polygon points="0.0,-28.0 7.2,-10.0 26.6,-8.7 11.7,3.8 16.5,22.7 0.0,12.3 -16.5,22.7 -11.7,3.8 -26.6,-8.7 -7.2,-10.0" className="fill-greymid" />
            <polygon points="0.0,-22.5 5.8,-8.0 21.4,-7.0 9.4,3.1 13.2,18.2 0.0,9.9 -13.2,18.2 -9.4,3.1 -21.4,-7.0 -5.8,-8.0" className="fill-white" />
            <polygon points="0.0,-17.0 4.4,-6.1 16.2,-5.3 7.1,2.3 10.0,13.8 0.0,7.5 -10.0,13.8 -7.1,2.3 -16.2,-5.3 -4.4,-6.1" className="fill-greymid" />
            <polygon points="0.0,-11.5 3.0,-4.1 10.9,-3.6 4.8,1.6 6.8,9.3 0.0,5.1 -6.8,9.3 -4.8,1.6 -10.9,-3.6 -3.0,-4.1" className="fill-white" />
            <polygon points="0.0,-6.0 1.6,-2.1 5.7,-1.9 2.5,0.8 3.5,4.9 0.0,2.6 -3.5,4.9 -2.5,0.8 -5.7,-1.9 -1.6,-2.1" className="fill-greymid" />
          </symbol>
        </defs>
          <use href="#star-a" transform="translate(-8 15) rotate(-23) scale(2.13)" />
          <use href="#star-a" transform="translate(136 -6) rotate(20) scale(2.5)" />
          <use href="#star-a" transform="translate(267 5) rotate(-21) scale(2.55)" />
          <use href="#star-a" transform="translate(392 7) rotate(15) scale(1.94)" />
          <use href="#star-a" transform="translate(25 131) rotate(1) scale(2)" />
          <use href="#star-a" transform="translate(142 125) rotate(33) scale(2.36)" />
          <use href="#star-b" transform="translate(255 114) rotate(-13) scale(2.57)" />
          <use href="#star-a" transform="translate(378 117) rotate(35) scale(2.14)" />
          <use href="#star-a" transform="translate(18 254) rotate(-18) scale(1.95)" />
          <use href="#star-b" transform="translate(135 237) rotate(33) scale(2.05)" />
          <use href="#star-a" transform="translate(255 234) rotate(34) scale(2.43)" />
          <use href="#star-a" transform="translate(373 237) rotate(-11) scale(2.13)" />
          <use href="#star-a" transform="translate(4 361) rotate(-21) scale(2.39)" />
          <use href="#star-a" transform="translate(133 373) rotate(11) scale(2.41)" />
          <use href="#star-a" transform="translate(260 367) rotate(-8) scale(2.65)" />
          <use href="#star-a" transform="translate(376 363) rotate(-14) scale(2.18)" />
          <use href="#star-b" transform="translate(21 494) rotate(26) scale(1.99)" />
          <use href="#star-b" transform="translate(132 468) rotate(40) scale(1.96)" />
          <use href="#star-b" transform="translate(265 467) rotate(7) scale(2.27)" />
          <use href="#star-a" transform="translate(400 494) rotate(31) scale(2.61)" />
          <use href="#star-b" transform="translate(19 592) rotate(-20) scale(1.91)" />
          <use href="#star-a" transform="translate(117 604) rotate(19) scale(2.09)" />
          <use href="#star-a" transform="translate(267 591) rotate(-21) scale(2.61)" />
          <use href="#star-a" transform="translate(399 586) rotate(-40) scale(2.29)" />
          <use href="#star-b" transform="translate(15 735) rotate(32) scale(1.92)" />
          <use href="#star-b" transform="translate(152 722) rotate(-19) scale(2.44)" />
          <use href="#star-a" transform="translate(250 722) rotate(22) scale(1.94)" />
          <use href="#star-a" transform="translate(393 720) rotate(-31) scale(1.93)" />
          <use href="#star-a" transform="translate(-3 847) rotate(-37) scale(2.61)" />
          <use href="#star-a" transform="translate(148 858) rotate(21) scale(2.66)" />
          <use href="#star-b" transform="translate(251 848) rotate(-8) scale(2.61)" />
          <use href="#star-a" transform="translate(382 854) rotate(-12) scale(2.35)" />
          <use href="#star-b" transform="translate(80 54) rotate(-6) scale(2.48)" />
          <use href="#star-a" transform="translate(190 77) rotate(11) scale(2.7)" />
          <use href="#star-a" transform="translate(337 49) rotate(-29) scale(2.42)" />
          <use href="#star-b" transform="translate(74 190) rotate(-1) scale(2.66)" />
          <use href="#star-a" transform="translate(195 168) rotate(2) scale(2.43)" />
          <use href="#star-b" transform="translate(322 189) rotate(20) scale(2.19)" />
          <use href="#star-b" transform="translate(65 302) rotate(18) scale(2.06)" />
          <use href="#star-a" transform="translate(187 306) rotate(-34) scale(2.24)" />
          <use href="#star-a" transform="translate(334 315) rotate(14) scale(2.63)" />
          <use href="#star-a" transform="translate(55 429) rotate(18) scale(2.38)" />
          <use href="#star-b" transform="translate(180 407) rotate(-31) scale(1.96)" />
          <use href="#star-b" transform="translate(304 424) rotate(-25) scale(2.66)" />
          <use href="#star-a" transform="translate(61 546) rotate(-3) scale(2.09)" />
          <use href="#star-a" transform="translate(194 546) rotate(-8) scale(2.52)" />
          <use href="#star-b" transform="translate(306 530) rotate(38) scale(2.55)" />
          <use href="#star-a" transform="translate(87 660) rotate(-23) scale(2)" />
          <use href="#star-a" transform="translate(185 645) rotate(12) scale(2.12)" />
          <use href="#star-b" transform="translate(321 678) rotate(-7) scale(1.96)" />
          <use href="#star-b" transform="translate(54 762) rotate(-33) scale(2.23)" />
          <use href="#star-a" transform="translate(212 790) rotate(-5) scale(2.51)" />
          <use href="#star-b" transform="translate(339 791) rotate(6) scale(2.43)" />
      </svg>

      {/* Background shapes: one black diagonal slab and one white stripe, flat */}
      <div aria-hidden="true" className="absolute inset-0 bg-black [clip-path:polygon(0_12%,100%_4%,100%_66%,0_76%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-white [clip-path:polygon(0_76%,100%_66%,100%_67.5%,0_77.5%)]" />

      {/* Running line: sits exactly on the black block's top edge, same tilt (atan(67.5/390) = 9.8deg) */}
      <div aria-hidden="true" className="absolute left-0 top-[12%] z-10 h-7 w-[110%] origin-bottom-left -translate-y-full -rotate-[9.8deg] overflow-hidden bg-white">
        <div className="flex w-max items-center whitespace-nowrap py-1.5 font-helvetica text-xs font-extrabold uppercase tracking-widest text-black motion-safe:animate-marquee">
          <span className="px-6">Fan-made and non-commercial. Not affiliated with Atlus or SEGA.</span>
          <span className="px-6">Fan-made and non-commercial. Not affiliated with Atlus or SEGA.</span>
          <span className="px-6">Fan-made and non-commercial. Not affiliated with Atlus or SEGA.</span>
          <span className="px-6">Fan-made and non-commercial. Not affiliated with Atlus or SEGA.</span>
        </div>
      </div>

      {/* Label: small skewed tag with a hard shadow */}
      <div className="relative z-10 motion-safe:animate-gate-in">
        <span className="inline-block -skew-x-12 bg-white px-3 py-1 font-expose text-sm tracking-widest text-black shadow-[4px_4px_0_var(--redbright)]">
          PHANTOM CORNER
        </span>
      </div>

      {/* Headline: no box. Each letter has its own font (Expose or Doctor Punk), size, tilt and stretch, black and white only, with a thick outline for contrast */}
      <h1 className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center leading-none motion-safe:animate-gate-in [animation-delay:80ms]">
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[52px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(-8deg)_scale(0.97,1.00)_skewX(2deg)]">H</span><span className="inline-block font-expose text-[46px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(3px)_rotate(-3deg)_scale(1.02,0.96)_skewX(5deg)]">o</span><span className="inline-block font-doctorpunk text-[50px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-2px)_rotate(-3deg)_scale(1.02,0.98)_skewX(-2deg)]">L</span><span className="inline-block font-expose text-[51px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-2px)_rotate(7deg)_scale(1.04,0.96)_skewX(-5deg)]">D</span></span>
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[51px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-3px)_rotate(0deg)_scale(0.90,1.03)_skewX(0deg)]">U</span><span className="inline-block font-doctorpunk text-[45px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(3px)_rotate(-8deg)_scale(0.97,1.14)_skewX(0deg)]">P</span><span className="inline-block font-doctorpunk text-[50px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(1px)_rotate(-7deg)_scale(1.04,1.01)_skewX(2deg)]">!</span></span>
        <span className="basis-full h-0"></span>
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[50px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(4px)_rotate(5deg)_scale(1.03,0.99)_skewX(-5deg)]">T</span><span className="inline-block font-expose text-[51px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-2px)_rotate(-4deg)_scale(0.94,0.97)_skewX(5deg)]">H</span><span className="inline-block font-expose text-[46px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(1px)_rotate(-3deg)_scale(1.05,1.04)_skewX(-7deg)]">I</span><span className="inline-block font-expose text-[49px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(6deg)_scale(1.09,1.08)_skewX(5deg)]">S</span></span>
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[43px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-1px)_rotate(-9deg)_scale(1.00,1.14)_skewX(-6deg)]">P</span><span className="inline-block font-doctorpunk text-[47px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-2px)_rotate(-3deg)_scale(1.08,1.12)_skewX(2deg)]">L</span><span className="inline-block font-expose text-[41px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(2px)_rotate(-1deg)_scale(0.93,1.01)_skewX(0deg)]">A</span><span className="inline-block font-doctorpunk text-[53px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(1px)_rotate(3deg)_scale(0.99,0.99)_skewX(-6deg)]">C</span><span className="inline-block font-expose text-[50px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(4px)_rotate(7deg)_scale(1.08,1.06)_skewX(-5deg)]">E</span></span>
        <span className="inline-flex items-center"><span className="inline-block font-doctorpunk text-[54px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(4deg)_scale(1.03,1.12)_skewX(-8deg)]">D</span><span className="inline-block font-doctorpunk text-[50px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(3px)_rotate(1deg)_scale(1.01,1.11)_skewX(-6deg)]">o</span><span className="inline-block font-expose text-[45px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(4px)_rotate(6deg)_scale(0.93,1.08)_skewX(0deg)]">E</span><span className="inline-block font-expose text-[52px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-1px)_rotate(8deg)_scale(1.05,1.07)_skewX(7deg)]">S</span><span className="inline-block font-doctorpunk text-[57px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(2px)_rotate(1deg)_scale(0.93,1.00)_skewX(2deg)]">N</span><span className="inline-block font-expose text-[49px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(4px)_rotate(2deg)_scale(1.02,0.99)_skewX(4deg)]">&apos;</span><span className="inline-block font-expose text-[50px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-3px)_rotate(2deg)_scale(1.07,1.02)_skewX(-1deg)]">T</span></span>
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[52px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:rotate(-4deg)]">F</span><span className="inline-block font-expose text-[38px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(3px)_rotate(-6deg)_scale(0.96,1.08)_skewX(8deg)]">I</span><span className="inline-block font-expose text-[39px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(2px)_rotate(0deg)_scale(0.99,1.06)_skewX(-3deg)]">T</span></span>
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[41px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(-3deg)_scale(1.03,0.97)_skewX(-3deg)]">I</span><span className="inline-block font-expose text-[51px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-3px)_rotate(1deg)_scale(1.00,1.01)_skewX(3deg)]">N</span></span>
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[44px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(-3deg)_scale(0.90,1.14)_skewX(5deg)]">Y</span><span className="inline-block font-doctorpunk text-[57px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(3px)_rotate(-2deg)_scale(0.93,1.07)_skewX(1deg)]">O</span><span className="inline-block font-doctorpunk text-[56px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(-2px)_rotate(-1deg)_scale(0.99,1.08)_skewX(4deg)]">U</span><span className="inline-block font-expose text-[42px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(4px)_rotate(5deg)_scale(1.07,1.02)_skewX(-5deg)]">R</span></span>
        <span className="inline-flex items-center"><span className="inline-block font-expose text-[44px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(3deg)_scale(0.91,0.96)_skewX(8deg)]">P</span><span className="inline-block font-expose text-[40px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(3px)_rotate(-8deg)_scale(1.09,1.02)_skewX(1deg)]">o</span><span className="inline-block font-doctorpunk text-[51px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(1px)_rotate(-2deg)_scale(0.97,1.01)_skewX(-3deg)]">C</span><span className="inline-block font-expose text-[47px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(-4deg)_scale(1.05,0.96)_skewX(-5deg)]">K</span><span className="inline-block font-doctorpunk text-[48px] text-black [-webkit-text-stroke:5px_var(--white)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(0px)_rotate(2deg)_scale(0.94,0.97)_skewX(7deg)]">E</span><span className="inline-block font-expose text-[50px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(1px)_rotate(-2deg)_scale(1.10,1.02)_skewX(-2deg)]">T</span><span className="inline-block font-doctorpunk text-[49px] text-white [-webkit-text-stroke:5px_var(--black)] [stroke-linejoin:round] [paint-order:stroke_fill] [transform:translateY(3px)_rotate(2deg)_scale(1.04,1.13)_skewX(-6deg)]">.</span></span>
      </h1>

      {/* Icon: minimal desktop monitor, flat shapes only */}
      <div aria-hidden="true" className="relative z-10 flex justify-center -rotate-3 motion-safe:animate-gate-in [animation-delay:120ms]">
        <svg width="84" height="72" viewBox="0 0 84 72" className="[filter:drop-shadow(4px_4px_0_var(--redbright))]">
          <rect x="4" y="4" width="76" height="46" className="fill-white" />
          <rect x="10" y="10" width="64" height="34" className="fill-black" />
          <polygon points="36,50 48,50 52,62 32,62" className="fill-white" />
          <rect x="22" y="62" width="40" height="6" className="fill-white" />
        </svg>
      </div>

      {/* Body: plain readable text on a white angled panel */}
      <p className="relative z-10 -skew-x-3 bg-white px-4 py-3 font-helvetica text-base font-bold leading-snug text-black shadow-[6px_6px_0_var(--redbright)] motion-safe:animate-gate-in [animation-delay:240ms]">
        Phantom Corner needs a bigger screen. Open this link on a laptop or desktop. LeBlanc's waiting.
      </p>

      {/* Tagline: red strip, slightly rotated */}
      <p className="relative z-10 -rotate-1 bg-redbright px-4 py-2 font-helvetica text-[15px] font-extrabold italic leading-tight text-white shadow-[5px_5px_0_var(--white)] ring-2 ring-white motion-safe:animate-gate-in [animation-delay:320ms]">
        Even a Phantom Thief needs to grind their Knowledge stat.
      </p>

      {/* Button: static "Copy link", black tilted slab with a white inner frame and mixed-font white lettering */}
      <div className="relative z-10 flex justify-center motion-safe:animate-gate-in [animation-delay:400ms]">
        <button type="button" className="-rotate-2 bg-white p-1 text-white shadow-[6px_6px_0_var(--black)] [clip-path:polygon(0_0,100%_6%,97%_100%,3%_94%)]">
          <span className="block bg-black px-10 py-2 [clip-path:polygon(1%_3%,99%_9%,96%_97%,4%_91%)]">
            <span className="inline-block font-doctorpunk text-[36px] [transform:rotate(-5deg)]">C</span><span className="inline-block font-expose text-[30px] [transform:rotate(4deg)_scaleY(1.15)]">O</span><span className="inline-block font-doctorpunk text-[34px] [transform:rotate(-3deg)]">P</span><span className="inline-block font-expose text-[32px] [transform:rotate(6deg)]">Y</span>
            <span className="inline-block w-3"></span>
            <span className="inline-block font-expose text-[34px] [transform:rotate(-4deg)_scaleY(1.1)]">L</span><span className="inline-block font-doctorpunk text-[32px] [transform:rotate(5deg)]">I</span><span className="inline-block font-doctorpunk text-[36px] [transform:rotate(-6deg)]">N</span><span className="inline-block font-expose text-[30px] [transform:rotate(3deg)_scaleY(1.15)]">K</span>
          </span>
        </button>
      </div>

      {/* Footer: developer contact */}
      <footer className="relative z-10 flex justify-center">
        <p className="-skew-x-3 bg-black px-4 py-2 text-center font-helvetica text-[11px] font-bold text-white shadow-[5px_5px_0_var(--redbright)] ring-2 ring-white">Contact developer at <a href="mailto:teezmixer@gmail.com" className="text-white underline">teezmixer@gmail.com</a></p>
      </footer>
    </main>
  );
}
