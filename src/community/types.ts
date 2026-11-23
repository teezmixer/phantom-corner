/**
 * Community features (spec §3.6, behind ?community=true): "X Phantom Thieves are studying here" and a vote for which bonus place
 * opens next. Until a backend exists (B-11) both run against `FakeCommunity`, whose numbers are made up, and say so.
 */
export interface CommunityBackend {
  /** How many other people are studying in this place right now. */
  presence(locationId: string, now: number): Promise<number>;
  /** Everyone's votes so far, by place id. */
  tally(): Promise<Record<string, number>>;
  /** Casts (or moves) this player's one vote. */
  vote(optionId: string): Promise<void>;
  /** The place this player voted for, if they have. */
  myVote(): string | null;
}
