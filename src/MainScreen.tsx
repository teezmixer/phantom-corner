import React from 'react';

import screenshot20260614At93936Pm1 from "./screenshot-2026-06-14-at-9-39-36-PM-1.png";

const panelBlocks = [
  {
    className: "absolute top-[15px] left-0 w-[251px] h-[164px] bg-[#d9d9d9]",
    label: "Weather / date",
  },
  {
    className: "absolute top-[212px] left-0 w-[204px] h-[66px] bg-[#d9d9d9]",
    label: "pomodoro timer",
  },
  {
    className: "absolute top-0 left-[1083px] w-[272px] h-[101px] bg-[#d9d9d9]",
    label: "mission",
  },
  {
    className:
      "absolute top-[134px] left-[1083px] w-[272px] h-[101px] bg-[#d9d9d9]",
    label: "todo list",
  },
  {
    className:
      "absolute top-[734px] left-[1091px] w-[264px] h-[67px] bg-[#d9d9d9]",
    label: "Location",
  },
  {
    className: "absolute top-[779px] left-0 w-[233px] h-[29px] bg-[#d9d9d9]",
    label: "buttons menu",
  },
  {
    className: "absolute top-[651px] left-0 w-[158px] h-[116px] bg-[#d9d9d9]",
    label: "xp / level",
  },
  {
    className:
      "absolute top-[625px] left-[1134px] w-[213px] h-[50px] bg-[#d9d9d9]",
    label: "music player",
  },
];

const textLabels = [
  {
    className:
      "absolute top-[37px] left-[41px] w-24 font-body-primary font-[number:var(--body-primary-font-weight)] text-[#000000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] [font-style:var(--body-primary-font-style)]",
    text: "Weather / date",
  },
  {
    className:
      "absolute top-[761px] left-0 w-[212px] font-body-primary font-[number:var(--body-primary-font-weight)] text-[#000000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] whitespace-nowrap [font-style:var(--body-primary-font-style)]",
    text: "buttons menu",
  },
  {
    className:
      "absolute top-[724px] left-[1124px] w-[187px] font-body-primary font-[number:var(--body-primary-font-weight)] text-[#000000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] whitespace-nowrap [font-style:var(--body-primary-font-style)]",
    text: "Location",
  },
  {
    className:
      "absolute top-0 left-[1120px] w-[162px] font-body-primary font-[number:var(--body-primary-font-weight)] text-[#000000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] [font-style:var(--body-primary-font-style)]",
    text: "mission",
  },
  {
    className:
      "absolute top-[153px] left-[1145px] w-[162px] font-body-primary font-[number:var(--body-primary-font-weight)] text-[#000000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] [font-style:var(--body-primary-font-style)]",
    text: "todo list",
  },
  {
    className:
      "absolute top-[207px] left-3 w-[165px] font-body-primary font-[number:var(--body-primary-font-weight)] text-[#000000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] [font-style:var(--body-primary-font-style)]",
    text: "pomodoro timer",
  },
  {
    className:
      "absolute top-[713px] left-3 w-[300px] font-body-primary font-[number:var(--body-primary-font-weight)] text-[#020000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] [font-style:var(--body-primary-font-style)]",
    text: "xp / level",
  },
  {
    className:
      "absolute top-[612px] left-[1168px] w-[110px] font-body-primary font-[number:var(--body-primary-font-weight)] text-[#000000] text-[length:var(--body-primary-font-size)] tracking-[var(--body-primary-letter-spacing)] leading-[var(--body-primary-line-height)] [font-style:var(--body-primary-font-style)]",
    text: "music player",
  },
];

export const MainScreen = (): React.JSX.Element => {
  return (
    <main className="w-screen h-screen relative overflow-hidden">
      <img
        className="absolute top-0 left-0 w-[1440px] h-[900px] aspect-[1.86]"
        alt="Background scene"
        src={screenshot20260614At93936Pm1}
      />
      <section
        aria-label="Widget panels"
        className="absolute top-[43px] left-[39px] w-[1355px] h-[808px]"
      >
        {panelBlocks.map((panel) => (
          <div
            key={panel.label}
            className={panel.className}
            aria-hidden="true"
          />
        ))}
      </section>
      <section
        aria-label="Widget labels"
        className="absolute top-[62px] left-[75px] w-[1327px] h-[782px]"
      >
        {textLabels.map((label) => (
          <div key={label.text} className={label.className}>
            {label.text}
          </div>
        ))}
      </section>
    </main>
  );
};

export default MainScreen;
