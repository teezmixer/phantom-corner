import { SHARE_CARD_FILENAME, SHARE_CARD_SIZE, type ShareCardLines } from "@/domain/shareCard";

/** Reads a design token at draw time, so the card's colours and fonts can only be the tokens' (never a literal here). */
const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Draws the card on a canvas using only token colours and token font families. */
export async function drawShareCard(canvas: HTMLCanvasElement, lines: ShareCardLines): Promise<void> {
  const { width, height } = SHARE_CARD_SIZE;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas");
  const hero = token("--display-hero-font-family");
  const body = token("--body-primary-font-family");
  try { await Promise.all([document.fonts.load(`100px ${hero}`), document.fonts.load(`32px ${body}`)]); } catch { /* the fallback faces in the token still draw */ }

  ctx.fillStyle = token("--black");
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = token("--redbright");
  ctx.fillRect(0, 0, 24, height); // a plain red edge: the card's only decoration, so no art is needed

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = token("--white");
  ctx.font = `64px ${hero}`;
  ctx.fillText(lines.title, 80, 120);

  ctx.font = `260px ${hero}`;
  ctx.fillText(lines.minutes, 80, 380);
  const numberWidth = ctx.measureText(lines.minutes).width;
  ctx.font = `44px ${body}`;
  ctx.fillStyle = token("--greylight");
  ctx.fillText(lines.minutesLabel, 80 + numberWidth + 32, 380);

  ctx.fillStyle = token("--redbright");
  ctx.font = `72px ${hero}`;
  ctx.fillText(lines.knowledge, 80, 480);
  ctx.fillStyle = token("--white");
  ctx.font = `40px ${body}`;
  ctx.fillText(lines.place, 80, 545);
  ctx.fillStyle = token("--greymid");
  ctx.font = `26px ${body}`;
  ctx.fillText(lines.fan, 80, 596);
}

/** Draws the card and hands it to the browser as a PNG download. */
export async function saveShareCard(lines: ShareCardLines): Promise<void> {
  const canvas = document.createElement("canvas");
  await drawShareCard(canvas, lines);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The card could not be made");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = SHARE_CARD_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
