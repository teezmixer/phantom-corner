import { useEffect, useState, type ReactNode } from "react";
import { community as copy } from "@/content/copy";
import { LOCATIONS } from "@/content/registry";
import { useStore } from "@/state/StoreProvider";
import { CommunityContext, type Community } from "./context";
import { FakeCommunity } from "./fake";
import type { CommunityBackend } from "./types";

const BONUS = LOCATIONS.filter((l) => l.canonIndex === null);
const REFRESH_MS = 60_000;
let shared: CommunityBackend | undefined;
/** The one backend of this visit. The fake until a real one exists (B-11). */
const defaultBackend = (): CommunityBackend => (shared ??= new FakeCommunity(BONUS.map((l) => l.id)));

/** The presence count and the vote, for one visit; and the line that says how many are here. */
export default function CommunityProvider({ children, backend }: { children: ReactNode; /** For tests: a backend of their own. */ backend?: CommunityBackend }) {
  const { state } = useStore();
  const api = backend ?? defaultBackend();
  const [presence, setPresence] = useState<number | null>(null);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<string | null>(api.myVote());

  useEffect(() => {
    let live = true;
    const load = () => api.presence(state.locationId, Date.now()).then((n) => { if (live) setPresence(n); }, () => { if (live) setPresence(null); });
    void load();
    const t = setInterval(() => { void load(); }, REFRESH_MS);
    return () => { live = false; clearInterval(t); };
  }, [api, state.locationId]);
  useEffect(() => { void api.tally().then(setTally, () => {}); }, [api]);

  const vote = async (id: string) => { await api.vote(id); setVoted(api.myVote()); setTally(await api.tally()); };
  const value: Community = { practice: true, presence, options: BONUS.map((l) => ({ id: l.id, name: l.name, votes: tally[l.id] ?? 0 })), voted, vote };

  return (
    <CommunityContext.Provider value={value}>
      {children}
      {state.entered && state.layer === "main" && presence !== null && presence > 0 && (
        <p role="status" className="pointer-events-none fixed bottom-2 left-1/2 z-40 -translate-x-1/2 border border-white bg-black px-2 py-0.5 font-body-primary text-xs text-white">
          {copy.presence(presence)} <span className="text-greylight">· {copy.practice}</span>
        </p>
      )}
    </CommunityContext.Provider>
  );
}
