import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CornerGroup, type Corner } from "./CornerGroup";

describe("CornerGroup", () => {
  it.each<[Corner, string]>([
    ["tl", "top left"],
    ["tr", "top right"],
    ["bl", "bottom left"],
    ["br", "bottom right"],
  ])("%s scales from its own corner (%s)", (corner, origin) => {
    render(<CornerGroup corner={corner} scale={1.5} label={`group ${corner}`}><span /></CornerGroup>);
    const group = screen.getByRole("region", { name: `group ${corner}` });
    expect(group.style.transformOrigin).toBe(origin);
    expect(group.style.transform).toBe("scale(1.5)");
  });
});
