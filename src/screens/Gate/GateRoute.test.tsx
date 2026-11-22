import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GateRoute from "./GateRoute";

const setUA = (ua: string) => vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);

describe("GateRoute", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the app on desktop", () => {
    setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/130");
    render(<GateRoute><p>the app</p></GateRoute>);
    expect(screen.getByText("the app")).toBeInTheDocument();
  });

  it("renders the gate on a phone, with a headline screen readers read as one sentence", () => {
    setUA("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148");
    render(<GateRoute><p>the app</p></GateRoute>);
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Hold up! This place doesn't fit in your pocket." })).toBeInTheDocument();
  });
});
