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

/** Post a message to the shared assertive live region. */
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
 * Mount a visually hidden element holding the instruction text and
 * return its id for `aria-describedby`. Identical texts share one
 * element, so a hundred draggables cost one node.
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
