/**
 * One screen can hand over to another (menu → Settings). While the second is open the room behind is still inert, so the
 * first screen's attempt to give focus back to the button that opened the menu is ignored, and the second screen would
 * then remember "nothing" as its opener. The opener is therefore carried across the swap, however long the second screen
 * takes to appear (it may be a chunk still downloading), and forgotten as soon as the room is back in front.
 */
let carried: HTMLElement | null = null;

export const carriedOpener = (): HTMLElement | null => carried;
export const carryOpener = (el: HTMLElement | null): void => { carried = el; };
export const forgetOpener = (): void => { carried = null; };

/**
 * The last thing in the room that had focus. A screen that arrives a moment late (a chunk still downloading) finds focus
 * already gone, because the room goes inert the instant the screen is asked for; this remembers what to give focus back to.
 * Anything inside a dialog is not remembered: that is where focus goes, not where it came from.
 */
let last: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("focusin", (e) => {
    if (e.target instanceof HTMLElement && !e.target.closest('[role="dialog"]')) last = e.target;
  });
}
export const lastRoomFocus = (): HTMLElement | null => (last?.isConnected ? last : null);
