import type { CommunityBackend } from "./types";

const hash = (s: string): number => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Made-up community numbers for the practice mode: a count that depends on the place and the hour (0 to 8, so it moves
 * during the day and is zero now and then), and a vote tally that starts with some invented votes and adds this player's.
 * Nothing leaves this page and nothing here is real; the interface says "practice" wherever it shows these.
 */
export class FakeCommunity implements CommunityBackend {
  private mine: string | null = null;
  private base: Record<string, number> = {};
  /** Set to make every call reject, as when the network is down. */
  down = false;

  constructor(optionIds: readonly string[]) {
    for (const id of optionIds) this.base[id] = hash(id) % 40;
  }

  async presence(locationId: string, now: number): Promise<number> {
    if (this.down) throw new Error("offline");
    return (hash(locationId) + new Date(now).getHours() * 3) % 9;
  }
  async tally(): Promise<Record<string, number>> {
    if (this.down) throw new Error("offline");
    const out = { ...this.base };
    if (this.mine) out[this.mine] = (out[this.mine] ?? 0) + 1;
    return out;
  }
  async vote(optionId: string): Promise<void> {
    if (this.down) throw new Error("offline");
    if (!(optionId in this.base)) throw new Error("Not an option.");
    this.mine = optionId; // one vote each: a second one moves it
  }
  myVote(): string | null { return this.mine; }
}
