import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LocationWidget from "./LocationWidget";

describe("LocationWidget", () => {
  it("names the current location for assistive tech and sight", () => {
    render(<LocationWidget locationId="leblanc" />);
    expect(screen.getByLabelText("Current location: Café Leblanc")).toBeInTheDocument();
    expect(screen.getByText("Café Leblanc")).toBeInTheDocument();
  });

  it("works for any registered location, with no art needed", () => {
    render(<LocationWidget locationId="ryuji" />);
    expect(screen.getByText("School rooftop")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("fails loudly for an unknown location", () => {
    expect(() => render(<LocationWidget locationId="nowhere" />)).toThrow(/Unknown location/);
  });
});
