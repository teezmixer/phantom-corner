import React from "react";
import MobileGate from "./MobileGate";
import { isPhoneBrowser } from "./isPhoneBrowser";

// Wrapper: phones see the gate, everyone else sees the real app.
export default function GateRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  return isPhoneBrowser() ? <MobileGate /> : <>{children}</>;
}
// Usage in App.tsx: <GateRoute><MainScreen /></GateRoute>
