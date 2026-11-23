import { community as copy } from "@/content/copy";
import { buttonClass } from "@/screens/Overlay";
import { useCommunity } from "./CommunityProvider";

/** Which bonus place should open next (spec §3.6): one vote each, a second moves it. Shown on the map, only when community is on. */
export function VotePanel() {
  const c = useCommunity();
  if (!c) return null;
  return (
    <section aria-label={copy.voteTitle} className="flex flex-col gap-2 border border-white p-3">
      <h3 className="text-sm text-greylight">{copy.voteTitle}</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {c.options.map((o) => (
          <li key={o.id}>
            <button type="button" aria-pressed={c.voted === o.id} onClick={() => void c.vote(o.id)} className={`${buttonClass} flex w-full items-center justify-between text-sm ${c.voted === o.id ? "bg-redbright" : ""}`}>
              <span>{o.name}</span>
              <span className="text-xs">{copy.votes(o.votes)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-greylight">{c.voted ? copy.voted : ""} {copy.voteNote}</p>
    </section>
  );
}
