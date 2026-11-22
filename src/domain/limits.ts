/** Input limits enforced where state changes, not only in the inputs (review of M3). PROVISIONAL numbers. */
export const MAX_TEXT = 80;
export const MAX_TODOS = 200;
/** Far above any real use; stops a corrupt or hostile log from freezing the fold. */
export const MAX_EVENTS = 50_000;

/** Trim and cap user text (mission, todo). */
export function clampText(text: string): string {
  return text.trim().slice(0, MAX_TEXT);
}
