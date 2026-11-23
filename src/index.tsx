import React from "react";
import ReactDOM from "react-dom/client";

import "@/styles/index.css";
import { Root } from "@/app/Root";
import { parseMode } from "@/app/initialState";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import GateRoute from "@/screens/Gate/GateRoute";

const mode = parseMode(window.location.search);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GateRoute>
        <Root mode={mode} />
      </GateRoute>
    </ErrorBoundary>
  </React.StrictMode>,
);
