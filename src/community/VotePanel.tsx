import { useState } from "react";
import { community as copy } from "@/content/copy";
import { buttonClass } from "@/screens/Overlay";
import { useStore } from "@/state/StoreProvider";
import { useCommunity } from "./context";

/**
 * Which bonus place should come up next (spec §3.6): one vote each, a second moves it. Shown on the map, only when community
 * is on, and only for bonus places that are still closed. It is a practice vote: it does not set the order places open in.
 */
export function VotePanel() {
  const c = useCommunity();
  const { derived } = useStore();
  const [failed, setFailed] = useState(false);
  if (!c) return null;
  const options = c.options.filter((o) => !derived.unlocked.includes(o.id));
  if (options.length === 0) return null;
  const cast = (id: string) => c.vote(id).then(() => setFailed(false), () => setFailed(true));
  return (
    <section aria-label={copy.voteTitle} className="flex flex-col gap-2 border border-white p-3">
      <h3 className="text-sm text-greylight">{copy.voteTitle}</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <li key={o.id}>
            <button type="button" aria-pressed={c.voted === o.id} onClick={() => void cast(o.id)} className={`${buttonClass} flex w-full items-center justify-between text-sm ${c.voted === o.id ? "bg-redbright" : ""}`}>
              <span>{o.name}</span>
              <span className="text-xs">{copy.votes(o.votes)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-greylight">{c.voted ? copy.voted : ""} {copy.voteNote}</p>
      {failed && <p role="status" className="text-xs">{copy.voteFailed}</p>}
    </section>
  );
}
