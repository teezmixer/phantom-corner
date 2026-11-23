import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sojiro } from "@/content/copy";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom({ when = true }: { when?: boolean }): React.JSX.Element {
  if (when) throw new Error("kaboom");
  return <p>fine</p>;
}

describe("ErrorBoundary", () => {
  it("shows its children while nothing is wrong", () => {
    render(<ErrorBoundary><Boom when={false} /></ErrorBoundary>);
    expect(screen.getByText("fine")).toBeInTheDocument();
    expect(screen.queryByTestId("app-error")).not.toBeInTheDocument();
  });

  it("swaps a broken subtree for Sojiro's line and one Reload button, reported once", async () => {
    const onError = vi.fn();
    const onReload = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {}); // React logs the caught error itself
    render(<ErrorBoundary onError={onError} onReload={onReload}><Boom /></ErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent(sojiro.appError);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Reload" })).toHaveFocus();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]?.message).toBe("kaboom");
    await userEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(onReload).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it("keeps a sibling outside the boundary alive", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<><p>outside</p><ErrorBoundary onError={() => {}}><Boom /></ErrorBoundary></>);
    expect(screen.getByText("outside")).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
