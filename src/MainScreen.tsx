import React, { useEffect, useState } from 'react';

import LocationWidget from "./LocationWidget";
import screenshot20260614At93936Pm1 from "./screenshot-2026-06-14-at-9-39-36-PM-1.png";

// The HUD is designed on a 1440x900 reference screen, then scaled to the real screen.
const REF_WIDTH = 1440;
const REF_HEIGHT = 900;

// How much to grow/shrink the HUD so it always fits inside the user's screen.
function useHudScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(
        Math.min(window.innerWidth / REF_WIDTH, window.innerHeight / REF_HEIGHT)
      );
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return scale;
}

type Corner = "tl" | "tr" | "bl" | "br";

// Where each corner group is pinned, and which point it scales from.
const CORNER_STYLES: Record<Corner, { position: string; origin: string }> = {
  tl: { position: "top-0 left-0", origin: "top left" },
  tr: { position: "top-0 right-0", origin: "top right" },
  bl: { position: "bottom-0 left-0", origin: "bottom left" },
  br: { position: "bottom-0 right-0", origin: "bottom right" },
};

// A corner group: a reference-sized box glued to one screen corner.
// Children are placed by their distance from THAT corner.
const CornerGroup = ({
  corner,
  scale,
  label,
  children,
}: {
  corner: Corner;
  scale: number;
  label: string;
  children: React.ReactNode;
}): React.JSX.Element => (
  <section
    aria-label={label}
    className={`absolute ${CORNER_STYLES[corner].position} pointer-events-none`}
    style={{
      width: REF_WIDTH,
      height: REF_HEIGHT,
      transform: `scale(${scale})`,
      transformOrigin: CORNER_STYLES[corner].origin,
    }}
  >
    {children}
  </section>
);

// Grey stand-in until the real widget exists. Delete it when the widget ships.
const Placeholder = ({
  label,
  className,
}: {
  label: string;
  className: string;
}): React.JSX.Element => (
  <div
    className={`absolute flex items-center justify-center bg-[#d9d9d9] font-body-primary text-black ${className}`}
  >
    {label}
  </div>
);

export const MainScreen = (): React.JSX.Element => {
  const scale = useHudScale();

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      <img
        className="absolute inset-0 w-full h-full object-cover"
        alt="Background scene"
        src={screenshot20260614At93936Pm1}
      />

      <CornerGroup corner="tl" scale={scale} label="Top left widgets">
        <Placeholder label="Weather / date" className="top-[58px] left-[39px] w-[251px] h-[164px]" />
        <Placeholder label="pomodoro timer" className="top-[255px] left-[39px] w-[204px] h-[66px]" />
      </CornerGroup>

      <CornerGroup corner="tr" scale={scale} label="Top right widgets">
        <Placeholder label="mission" className="top-[43px] right-[46px] w-[272px] h-[101px]" />
        <Placeholder label="todo list" className="top-[177px] right-[46px] w-[272px] h-[101px]" />
      </CornerGroup>

      <CornerGroup corner="bl" scale={scale} label="Bottom left widgets">
        <Placeholder label="xp / level" className="bottom-[90px] left-[39px] w-[158px] h-[116px]" />
        <Placeholder label="buttons menu" className="bottom-[49px] left-[39px] w-[233px] h-[29px]" />
      </CornerGroup>

      <CornerGroup corner="br" scale={scale} label="Bottom right widgets">
        <Placeholder label="music player" className="bottom-[260px] right-[39px] w-[213px] h-[50px]" />
        <LocationWidget
          spaceId="leblanc"
          className="absolute bottom-[49px] right-[39px] w-[484px] h-[218px]"
        />
      </CornerGroup>
    </main>
  );
};

export default MainScreen;
