import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AudioProvider } from "@/audio/AudioProvider";
import type { AudioEngine } from "@/audio/engine";
import { settings } from "@/content/copy";
import { motion } from "@/motion/tokens";
import { repairSettings } from "@/state/persistence/repair";
import { initialState, reducer, syncGroups, type AppState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import { Menu } from "./Menu";

const engine = { unlocked: true, unlock: vi.fn(), configure: vi.fn(), setAmbience: vi.fn(), setLayerLevels: vi.fn(), stopAmbience: vi.fn(), playSfx: vi.fn() };
const show = (patch: Partial<AppState>) =>
  render(<StoreProvider initial={{ ...initialState, entered: true, layer: "menu", ...patch }}><AudioProvider engine={engine as unknown as AudioEngine}><Menu /></AudioProvider></StoreProvider>);

describe("the menu style", () => {
  it("the plain text menu has no art slot and no Morgana", () => {
    show({ menuStyle: "text" });
    expect(screen.queryByTestId("menu-art")).not.toBeInTheDocument();
    expect(screen.queryByTestId("morgana-peek")).not.toBeInTheDocument();
  });

  it("the illustrated one has a slot for Student Ren and Morgana's placeholder, both named for assistive tech, with the same labels", () => {
    show({ menuStyle: "illustrated" });
    expect(screen.getByRole("img", { name: settings.menuArtSlot })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: settings.menuMorgana })).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["STUDY", "MAP Not yet.", "MESSAGES", "PROFILE", "SETTINGS", "CLOSE"]); // the map is not earned yet
  });

  it("Morgana rises with a transform and is a 100 ms cut when motion is reduced (class-wise, and by token)", () => {
    show({ menuStyle: "illustrated" });
    const peek = screen.getByTestId("morgana-peek");
    expect(peek.className).toContain("motion-safe:animate-morgana-peek");
    expect(peek.className).toContain("motion-reduce:animate-menu-cut");
    expect(motion.morganaPeek).toBeGreaterThan(0);
  });

  it("the choice is a setting: switched by an action, ignored if it is not a style, saved with the settings, and repaired on load", () => {
    const s = reducer({ ...initialState, entered: true }, { type: "SET_MENU_STYLE", style: "illustrated" });
    expect(s.menuStyle).toBe("illustrated");
    expect(reducer(s, { type: "SET_MENU_STYLE", style: "neon" as never }).menuStyle).toBe("illustrated");
    expect(repairSettings({ menuStyle: "neon" }).menuStyle).toBe("text");
    expect(repairSettings({ menuStyle: "illustrated" }).menuStyle).toBe("illustrated");
    expect(repairSettings({}).menuStyle).toBe("text"); // a save from before the setting
  });

  it("is part of the synced settings: changing it changes the document's comparable form", () => {
    const a = initialState;
    expect(syncGroups({ ...a, menuStyle: "illustrated" }).settings).not.toBe(syncGroups(a).settings);
  });
});
