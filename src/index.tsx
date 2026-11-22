import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import "@/styles/index.css";
import { Root } from "@/app/Root";
import { parseMode } from "@/app/initialState";
import GateRoute from "@/screens/Gate/GateRoute";

const mode = parseMode(window.location.search);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GateRoute>
      <MotionConfig reducedMotion="user">
        <Root mode={mode} />
      </MotionConfig>
    </GateRoute>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
