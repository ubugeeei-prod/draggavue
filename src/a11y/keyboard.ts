import type { Delta } from "../shared/geometry";
import type { Px } from "../shared/units";
import { px } from "../shared/units";

// --- Types & Signatures ---

/** What a key press means for a drag session. */
export type DragIntent =
  | { readonly kind: "none" }
  | { readonly kind: "grab" }
  | { readonly kind: "drop" }
  | { readonly kind: "move"; readonly delta: Delta }
  | { readonly kind: "cancel" };

export type KeyboardSteps = {
  /** Arrow-key step in pixels. */
  readonly step: Px;
  /** Step used while Shift is held, for fine positioning. */
  readonly fineStep: Px;
};

export type intentFromKey = (
  key: string,
  shiftKey: boolean,
  grabbed: boolean,
  steps: KeyboardSteps,
) => DragIntent;

// --- Implementation ---

export const DEFAULT_STEPS: KeyboardSteps = { step: px(10), fineStep: px(1) };

const NONE: DragIntent = { kind: "none" };

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/**
 * WAI-ARIA style keyboard grammar: space/enter toggles grab and
 * drop, arrows move, escape (or tabbing away) cancels.
 */
export const intentFromKey: intentFromKey = (key, shiftKey, grabbed, steps) => {
  if (key === " " || key === "Enter") {
    return { kind: grabbed ? "drop" : "grab" };
  }
  if (!grabbed) return NONE;
  if (key === "Escape") return { kind: "cancel" };
  if (key === "Tab") return { kind: "cancel" };
  const direction = ARROWS[key];
  if (direction === undefined) return NONE;
  const size = shiftKey ? steps.fineStep : steps.step;
  return {
    kind: "move",
    delta: { dx: px(direction[0] * size), dy: px(direction[1] * size) },
  };
};
