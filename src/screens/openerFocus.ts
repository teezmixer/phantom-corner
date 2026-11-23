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
