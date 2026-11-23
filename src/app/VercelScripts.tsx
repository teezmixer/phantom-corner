import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { analyticsGate } from "./telemetry";

/** Vercel's page-view and speed scripts, in their own chunk: loaded only while the Settings switch is on. */
export default function VercelScripts() {
  return (
    <>
      <Analytics beforeSend={analyticsGate} />
      <SpeedInsights beforeSend={analyticsGate} />
    </>
  );
}
