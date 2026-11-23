import { shareCardText } from "@/content/copy";

/**
 * What the shareable session card says. Pure and deliberately narrow: it takes only the three numbers and words that are
 * safe to show anyone (minutes, Knowledge, the place), so the player's name, mission and todos cannot reach the image
 * (spec §5, "without personal text"). The drawing lives in src/screens/Summary/shareCardImage.ts.
 */
export interface ShareCardInput {
  minutes: number;
  knowledge: number;
  /** A place's public name, e.g. "Café Leblanc". */
  location: string;
}

export interface ShareCardLines {
  title: string;
  minutes: string;
  minutesLabel: string;
  knowledge: string;
  place: string;
  fan: string;
}

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;
export const SHARE_CARD_FILENAME = "phantom-corner-session.png";

const whole = (n: number): number => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

export function shareCardLines({ minutes, knowledge, location }: ShareCardInput): ShareCardLines {
  return {
    title: shareCardText.title,
    minutes: String(whole(minutes)),
    minutesLabel: shareCardText.minutesLabel,
    knowledge: `+${whole(knowledge)} ${shareCardText.knowledge}`,
    place: location,
    fan: shareCardText.fan,
  };
}
