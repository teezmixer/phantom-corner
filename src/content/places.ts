/**
 * PROVISIONAL — which place stands for each location (spec §3.3, decision D-07 / spec D9).
 * The canon ORDER is DECIDED; the places, registers and sound notes are the spec author's proposal.
 * Generic names only (no venue or shop names from the game). Change any entry here; nothing else needs editing.
 */
export interface Place {
  name: string;
  register: string;
  sound: string;
  provisional: boolean;
}

export const PLACES: Record<string, Place> = {
  leblanc: { name: "Café Leblanc", register: "Warm, slow, safe", sound: "Café murmur, rain on glass, jazz", provisional: false },
  ryuji: { name: "School rooftop", register: "Loose, open air, short sprints", sound: "Wind, distant sports field", provisional: true },
  ann: { name: "Café terrace", register: "Upbeat, daylight", sound: "Street chatter, crossing signal", provisional: true },
  yusuke: { name: "Atelier by the park", register: "Quiet, airy, creative", sound: "Brush on paper, birds", provisional: true },
  makoto: { name: "School library", register: "Disciplined, silent", sound: "Pages, clock, pencil", provisional: true },
  futaba: { name: "Futaba's room", register: "Dark, screen glow, flow state", sound: "Fans, keys, muffled city", provisional: true },
  haru: { name: "Rooftop garden", register: "Gentle, fresh", sound: "Watering can, breeze", provisional: true },
  akechi: { name: "Jazz club", register: "Precise, low light, pressure", sound: "Brushed drums, glasses", provisional: true },
  "rainy-walk": { name: "Rainy walk", register: "Wet streets, umbrellas, drifting", sound: "Rain, footsteps", provisional: true },
  subway: { name: "Subway ride home", register: "Rocking carriage, tired and calm", sound: "Rails, announcements", provisional: true },
  "velvet-room": { name: "Velvet Room", register: "Dreamlike, blue, timeless", sound: "Low hum, distant voice", provisional: true },
  mementos: { name: "Mementos", register: "Underground, tense, endless", sound: "Rumble, wind in tunnels", provisional: true },
};
