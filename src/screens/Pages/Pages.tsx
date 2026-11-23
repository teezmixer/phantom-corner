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
      <p className="text-sm text-greylight">Made for people who study, so it is not meant for children.</p>
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
      <p className="text-sm text-greylight">The background is a placeholder screenshot from an early build, to be replaced. Music plays through YouTube's own player; the tracks belong to their owners. {splash.disclaimer}</p>
    </Overlay>
  );
}

export function PrivacyScreen() {
  return (
    <Overlay title="Privacy">
      <p>What you do here is saved in this browser on this device: your name, mission, todos, sessions and settings. There are no accounts yet, and nothing you write is sent anywhere. Settings → Delete everything removes it.</p>
      <p>Optionally, the page counts visits and speed, and a few events: which place you are in, how long a session was, and what level you are. Never your name, mission or todos. Turn it off any time in Settings. The events are not sent in the demo.</p>
      <p>The TV plays music through YouTube's player, which loads once you press enter. It is the privacy-enhanced version, but it is YouTube's, and its own policy applies to what it collects.</p>
      <p className="text-sm text-greylight">Draft: the final wording and a contact address are still to be decided by the project owner.</p>
    </Overlay>
  );
}
