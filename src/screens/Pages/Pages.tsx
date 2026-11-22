import { splash } from "@/content/copy";
import { Overlay } from "../Overlay";

/** About, credits and privacy. Text is DRAFT (decision D-10, D-14): the privacy policy is Ares's call. */
const CREDITS: { name: string; what: string; licence: string }[] = [
  { name: "Cult UI by Nolly Studio", what: "Component sources adapted in src/components/ui (rolling-number, side-panel, dock, halo-progress, sortable-list, timer, typewriter)", licence: "MIT" },
  { name: "Phosphor Icons", what: "App icons", licence: "MIT" },
  { name: "Motion", what: "Animation", licence: "MIT" },
  { name: "React, Vite, Tailwind CSS", what: "Build and styling", licence: "MIT" },
];

export function AboutScreen() {
  return (
    <Overlay title="About">
      <p>Phantom Corner is a study room: set a mission, start a session, and earn your way to new places.</p>
      <p className="text-sm text-greylight">{splash.disclaimer}</p>
    </Overlay>
  );
}

export function CreditsScreen() {
  return (
    <Overlay title="Credits">
      <ul className="flex flex-col gap-2 text-sm">
        {CREDITS.map((c) => (
          <li key={c.name} className="border border-white p-2"><strong>{c.name}</strong> — {c.what} <span className="text-greylight">({c.licence})</span></li>
        ))}
      </ul>
      <p className="text-sm text-greylight">Fan project. Persona 5 belongs to ATLUS and SEGA; no official assets are used.</p>
    </Overlay>
  );
}

export function PrivacyScreen() {
  return (
    <Overlay title="Privacy">
      <p>Everything you do here stays in this browser for now. Nothing is sent anywhere, and there are no accounts yet.</p>
      <p className="text-sm text-greylight">Draft: the final privacy text, analytics wording and contact address are still to be decided.</p>
    </Overlay>
  );
}
