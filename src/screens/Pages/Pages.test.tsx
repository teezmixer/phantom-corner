import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { splash } from "@/content/copy";
import { initialState } from "@/state/store";
import { StoreProvider } from "@/state/StoreProvider";
import { AboutScreen, CreditsScreen, PrivacyScreen } from "./Pages";

const show = (ui: React.JSX.Element) => render(<StoreProvider initial={{ ...initialState, entered: true, layer: "about" }}>{ui}</StoreProvider>);

describe("About, Credits and Privacy", () => {
  it("About carries the fan-project line and says it is not for children", () => {
    show(<AboutScreen />);
    expect(screen.getByText(splash.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(/not meant for children/)).toBeInTheDocument();
  });

  it("Credits names Cult UI and its MIT licence, and says the music is YouTube's", () => {
    show(<CreditsScreen />);
    expect(screen.getByText(/Cult UI by Nolly Studio/).closest("li")).toHaveTextContent("MIT");
    expect(screen.getByText(/YouTube's own player/)).toBeInTheDocument();
  });

  it("Privacy says what is saved, what analytics sends and never sends, and that YouTube's policy applies", () => {
    show(<PrivacyScreen />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/saved in this browser/);
    expect(text).toMatch(/Never your name, mission or todos/);
    expect(text).toMatch(/Turn it off any time in Settings/);
    expect(text).toMatch(/YouTube's player/);
    expect(text).toMatch(/its own policy applies/);
  });
});
