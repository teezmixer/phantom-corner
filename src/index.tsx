import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import "@/styles/index.css";
import { App } from "@/app/App";
import { buildInitialState, parseMode } from "@/app/initialState";
import GateRoute from "@/screens/Gate/GateRoute";
import { StoreProvider } from "@/state/StoreProvider";

const mode = parseMode(window.location.search);
const initial = buildInitialState(mode, Date.now());

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <GateRoute>
      <MotionConfig reducedMotion="user">
        <StoreProvider initial={initial}>
          <App dev={mode.dev} />
        </StoreProvider>
      </MotionConfig>
    </GateRoute>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
