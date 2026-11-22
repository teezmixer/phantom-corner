module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  corePlugins: { preflight: true },
  theme: {
    extend: {
      colors: {
        accentblue: "var(--accentblue)",
        accentgold: "var(--accentgold)",
        accentmint: "var(--accentmint)",
        accentpink: "var(--accentpink)",
        accentteal: "var(--accentteal)",
        accentyellow: "var(--accentyellow)",
        black: "var(--black)",
        greydark: "var(--greydark)",
        greylight: "var(--greylight)",
        greymid: "var(--greymid)",
        redbright: "var(--redbright)",
        reddeep: "var(--reddeep)",
        redmid: "var(--redmid)",
        white: "var(--white)",
      },
      fontFamily: {
        "body-primary": "var(--body-primary-font-family)",
        "body-secondary": "var(--body-secondary-font-family)",
        "display-hero": "var(--display-hero-font-family)",
        "display-label": "var(--display-label-font-family)",
        "display-title": "var(--display-title-font-family)",
        "hud-small": "var(--hud-small-font-family)",
        "hud-timer": "var(--hud-timer-font-family)",
        expose: "var(--font-expose)",
        doctorpunk: "var(--font-doctorpunk)",
        helvetica: "var(--font-helvetica)",
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "gate-in": {
          "0%": { opacity: "0", transform: "translateY(16px) skewX(-6deg)" },
          "100%": { opacity: "1", transform: "none" },
        },
      },
      animation: {
        marquee: "marquee 18s linear infinite",
        "gate-in": "gate-in 420ms cubic-bezier(.2,.9,.3,1) both",
      },
    },
  },
  plugins: [],
};
