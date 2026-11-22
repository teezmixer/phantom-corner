import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy classes and drops falsy ones", () => {
    const off = false;
    expect(cn("a", off && "b", undefined, "c")).toBe("a c");
  });
  it("lets the later Tailwind utility win", () => {
    expect(cn("bg-black p-2", "bg-redbright")).toBe("p-2 bg-redbright");
  });
});
