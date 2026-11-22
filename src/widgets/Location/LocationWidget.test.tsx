import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LocationWidget from "./LocationWidget";

describe("LocationWidget", () => {
  it("shows the hand-drawn sign when the location has art", () => {
    render(<LocationWidget spaceId="leblanc" />);
    expect(screen.getByRole("img", { name: "Café Leblanc" })).toBeInTheDocument();
  });

  it("falls back to the place name when there is no art yet", () => {
    render(<LocationWidget spaceId="ryuji" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Ryuji's Place")).toBeInTheDocument();
  });
});
