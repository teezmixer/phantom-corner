import { createContext, useContext } from "react";

export interface Community {
  /** True while the numbers are the made-up practice ones. */
  practice: boolean;
  /** People in this place now, or null before the first answer or when the server is out of reach (nothing is shown then). */
  presence: number | null;
  /** The bonus places that can be voted for, with their votes so far. */
  options: { id: string; name: string; votes: number }[];
  voted: string | null;
  vote(id: string): Promise<void>;
}

export const CommunityContext = createContext<Community | null>(null);

/** The community, or null when it is switched off for this visit. Its own small module, so the map can ask without loading the provider. */
export const useCommunity = (): Community | null => useContext(CommunityContext);
