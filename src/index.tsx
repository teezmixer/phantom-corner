import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import "@/styles/index.css";
import MainScreen from "@/app/MainScreen";
import GateRoute from "@/screens/Gate/GateRoute";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <GateRoute>
      <MainScreen />
    </GateRoute>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
