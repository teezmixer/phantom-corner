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
      },
    },
  },
  plugins: [],
};
