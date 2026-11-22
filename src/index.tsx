import React from "react";
import ReactDOM from "react-dom/client";
import { MotionConfig } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import "@/styles/index.css";
import { bootstrap } from "@/app/bootstrap";
import { Root } from "@/app/Root";
import { parseMode } from "@/app/initialState";
import GateRoute from "@/screens/Gate/GateRoute";
import { localStorageAdapter } from "@/state/persistence/adapter";
import { STORAGE_KEY } from "@/state/persistence/schema";

const mode = parseMode(window.location.search);
const boot = bootstrap(mode, Date.now(), localStorageAdapter(STORAGE_KEY), () => crypto.randomUUID());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GateRoute>
      <MotionConfig reducedMotion="user">
        <Root boot={boot} dev={mode.dev} />
      </MotionConfig>
    </GateRoute>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
