import type { Delta } from "../shared/geometry";
import type { Px } from "../shared/units";
import { px } from "../shared/units";

// --- Types & Signatures ---

/**
 * What a key press means for a drag session.
 *
 * The intent is pure data: {@link intentFromKey} classifies the key,
 * and the caller decides how to act (feed the state machine, emit,
 * ignore). This keeps the keyboard grammar testable without a DOM
 * and reusable across free dragging and list reordering.
 */
export type DragIntent =
  | { readonly kind: "none" }
  | { readonly kind: "grab" }
  | { readonly kind: "drop" }
  | { readonly kind: "move"; readonly delta: Delta }
  | { readonly kind: "cancel" };

/**
 * Arrow-key travel per press.
 *
 * @see {@link DEFAULT_STEPS} for the defaults.
 */
export type KeyboardSteps = {
  /**
   * Distance per arrow press.
   *
   * @default px(10)
   */
  readonly step: Px;
  /**
   * Distance per arrow press while Shift is held — the precision
   * modifier for fine positioning.
   *
   * @default px(1)
   */
  readonly fineStep: Px;
};

export type intentFromKey = (
  key: string,
  shiftKey: boolean,
  grabbed: boolean,
  steps: KeyboardSteps,
) => DragIntent;

// --- Implementation ---

/**
 * `{ step: px(10), fineStep: px(1) }` — comfortable travel with a
 * Shift precision mode.
 */
export const DEFAULT_STEPS: KeyboardSteps = { step: px(10), fineStep: px(1) };

const NONE: DragIntent = { kind: "none" };

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/**
 * Classify one key press under the WAI-ARIA style drag grammar.
 *
 * | Key | Not grabbed | Grabbed |
 * | --- | --- | --- |
 * | Space / Enter | `grab` | `drop` |
 * | Arrow keys | `none` | `move` by `step` (`fineStep` with Shift) |
 * | Escape | `none` | `cancel` |
 * | Tab | `none` | `cancel` (focus should keep moving naturally) |
 *
 * Everything else is `none`, so the handler can bail without
 * swallowing unrelated shortcuts.
 *
 * @param key - `KeyboardEvent.key`, unmodified.
 * @param shiftKey - Whether Shift was held (selects `fineStep`).
 * @param grabbed - Whether a keyboard session is currently active.
 * @param steps - Travel distances, e.g. {@link DEFAULT_STEPS}.
 *
 * @example
 * ```ts
 * intentFromKey(" ", false, false, DEFAULT_STEPS);
 * // => { kind: "grab" }
 *
 * intentFromKey("ArrowDown", true, true, DEFAULT_STEPS);
 * // => { kind: "move", delta: { dx: 0, dy: 1 } }
 * ```
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
