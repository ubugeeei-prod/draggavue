// Live-region plumbing shared by every drag instance. Everything is
// created lazily on first use, so importing this file is SSR-safe.

const HIDDEN_STYLE =
  "position:fixed;width:1px;height:1px;margin:-1px;padding:0;border:0;" +
  "clip-path:inset(100%);overflow:hidden;white-space:nowrap;";

let liveRegion: HTMLElement | null = null;
const instructionIds = new Map<string, string>();

export type announce = (message: string) => void;
export type ensureInstructionsElement = (text: string) => string;

const createHiddenElement = (): HTMLElement => {
  const element = document.createElement("div");
  element.setAttribute("style", HIDDEN_STYLE);
  document.body.appendChild(element);
  return element;
};

/**
 * Post a message to the shared assertive live region.
 *
 * One visually hidden `role="status"` node serves the whole app —
 * created on the first call, recreated if something removed it —
 * so a page full of draggables costs a single DOM node and screen
 * readers hear one coherent stream instead of overlapping regions.
 *
 * The region is `aria-live="assertive"`: drag feedback narrates the
 * user's *own* current action, which is exactly the case assertive
 * announcements exist for.
 *
 * Safe to call during SSR (it becomes a no-op without a
 * `document`).
 *
 * @example Announcing a custom milestone
 * ```ts
 * import { announce } from "draggavue";
 *
 * announce("Card moved to the Done column.");
 * ```
 */
export const announce: announce = (message) => {
  if (typeof document === "undefined") return;

  if (liveRegion === null || !liveRegion.isConnected) {
    liveRegion = createHiddenElement();
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "assertive");
    liveRegion.setAttribute("aria-atomic", "true");
  }

  liveRegion.textContent = message;
};

/**
 * Mount a visually hidden element holding instruction text and
 * return its id for `aria-describedby`.
 *
 * Identical texts share one node app-wide: a hundred draggables
 * using the default instructions cost exactly one element, while a
 * component with custom instructions transparently gets its own.
 *
 * @param text - The instruction sentence screen readers should read
 * when the handle is focused.
 * @returns A stable element id, ready for `aria-describedby`.
 */
export const ensureInstructionsElement: ensureInstructionsElement = (text) => {
  const existing = instructionIds.get(text);
  if (existing !== undefined) return existing;

  const element = createHiddenElement();
  const id = `draggavue-instructions-${instructionIds.size + 1}`;
  element.id = id;
  element.textContent = text;
  instructionIds.set(text, id);

  return id;
};
