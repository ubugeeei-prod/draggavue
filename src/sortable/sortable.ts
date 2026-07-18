import type { Delta, Rect } from "../shared/geometry";
import type { Px } from "../shared/units";
import { px } from "../shared/units";

// --- Types & Signatures ---

/**
 * Which way a list flows.
 *
 * The orientation picks the *main axis*: all reorder math — item
 * centers, drag offsets, keyboard steps — projects onto it, and the
 * cross axis is ignored entirely.
 */
export type Orientation = "vertical" | "horizontal";

/**
 * Geometry of a list captured once at session start.
 *
 * Everything the reorder math needs with the DOM already left
 * behind: after this snapshot exists, a whole drag session runs on
 * pure arithmetic. Layouts assume the roughly uniform spacing of a
 * real list (the shift distance is measured once, between the
 * dragged item and its nearest neighbor).
 *
 * @see {@link layoutFromRects} for the constructor.
 */
export type SortableLayout = {
  readonly orientation: Orientation;
  /** Main-axis center of each item, in source order. */
  readonly centers: readonly Px[];
  /** Distance neighbors shift to make room (item size + gap). */
  readonly shift: Px;
};

export type reorder = <T>(items: readonly T[], from: number, to: number) => readonly T[];
export type layoutFromRects = (
  rects: readonly Rect[],
  orientation: Orientation,
  draggedIndex: number,
) => SortableLayout;
export type targetIndexOf = (layout: SortableLayout, from: number, offset: Px) => number;
export type shiftFor = (index: number, from: number, to: number, amount: Px) => Px;
export type mainAxisOffset = (delta: Delta, orientation: Orientation) => Px;
export type indexStepOf = (delta: Delta, orientation: Orientation) => -1 | 0 | 1;

// --- Implementation ---

/**
 * Move one item to a new index, immutably.
 *
 * The input array is never touched. Out-of-range indices and
 * `from === to` return the *same reference*, so downstream
 * `===` checks (and Vue's reactivity) see "nothing changed" for
 * free.
 *
 * @example
 * ```ts
 * const items = ["a", "b", "c", "d"] as const;
 *
 * reorder(items, 0, 2); // => ["b", "c", "a", "d"]
 * reorder(items, 3, 1); // => ["a", "d", "b", "c"]
 * reorder(items, 2, 2) === items; // => true
 * ```
 */
export const reorder: reorder = (items, from, to) => {
  if (from === to) return items;
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items;

  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return items;

  next.splice(to, 0, moved);
  return next;
};

const mainAxisStart = (rect: Rect, orientation: Orientation): number =>
  orientation === "vertical" ? rect.top : rect.left;

const mainAxisSize = (rect: Rect, orientation: Orientation): number =>
  orientation === "vertical" ? rect.height : rect.width;

/**
 * Capture list geometry as a {@link SortableLayout}.
 *
 * `centers` is the main-axis midpoint of every rect in source
 * order. `shift` — how far resting items slide to make room — is
 * the dragged item's main-axis size plus the gap to its nearest
 * neighbor, which matches any list with roughly uniform spacing.
 * A single-item list gets a zero gap and simply cannot reorder.
 *
 * @param rects - Client rects of the items, in source order.
 * @param orientation - The list's main axis.
 * @param draggedIndex - The item being picked up (its size feeds
 * the shift distance).
 *
 * @example Four 40px rows with a 10px gap
 * ```ts
 * layoutFromRects(rows, "vertical", 1);
 * // => { orientation: "vertical", centers: [20, 70, 120, 170], shift: 50 }
 * ```
 */
export const layoutFromRects: layoutFromRects = (rects, orientation, draggedIndex) => {
  const centers = rects.map((rect) =>
    px(mainAxisStart(rect, orientation) + mainAxisSize(rect, orientation) / 2),
  );

  const dragged = rects[draggedIndex];
  const neighbor = rects[draggedIndex + 1] ?? rects[draggedIndex - 1];
  const size = dragged === undefined ? 0 : mainAxisSize(dragged, orientation);
  const gap =
    dragged === undefined || neighbor === undefined
      ? 0
      : Math.abs(mainAxisStart(neighbor, orientation) - mainAxisStart(dragged, orientation)) - size;

  return { orientation, centers, shift: px(size + Math.max(0, gap)) };
};

/**
 * Where the dragged item belongs right now.
 *
 * The rule reads like the gesture feels: while moving *up* the item
 * claims the **first** center it passed; while moving *down*, the
 * **last**. Sitting between centers (less than half a slot of
 * travel) keeps the current index, so small wiggles never reorder.
 *
 * @param layout - Geometry captured at session start.
 * @param from - The dragged item's source index.
 * @param offset - The dragged item's current main-axis translation.
 * @returns The index the item would occupy if dropped now.
 *
 * @example
 * ```ts
 * // centers: [20, 70, 120, 170] — 50px pitch
 * targetIndexOf(layout, 0, px(60));  // => 1 (passed the second center)
 * targetIndexOf(layout, 0, px(160)); // => 3
 * targetIndexOf(layout, 3, px(-60)); // => 2
 * targetIndexOf(layout, 1, px(20));  // => 1 (under half a slot)
 * ```
 */
export const targetIndexOf: targetIndexOf = (layout, from, offset) => {
  const origin = layout.centers[from];
  if (origin === undefined) return from;

  const moved = origin + offset;

  for (let index = 0; index < from; index += 1) {
    const center = layout.centers[index];
    if (center !== undefined && moved < center) return index;
  }

  for (let index = layout.centers.length - 1; index > from; index -= 1) {
    const center = layout.centers[index];
    if (center !== undefined && moved > center) return index;
  }

  return from;
};

/**
 * How far the resting item at `index` shifts while item `from`
 * hovers over slot `to`.
 *
 * Items between the origin and the target slide one `amount`
 * toward the vacated slot; everything else stays put. The dragged
 * index itself always reports `0` — its movement comes from the
 * live drag offset, not from make-room shifting.
 *
 * @example Dragging item 0 down over slot 2 (amount 50)
 * ```ts
 * shiftFor(1, 0, 2, px(50)); // => -50 (slides up)
 * shiftFor(2, 0, 2, px(50)); // => -50
 * shiftFor(3, 0, 2, px(50)); // => 0
 * ```
 */
export const shiftFor: shiftFor = (index, from, to, amount) => {
  if (from < to && index > from && index <= to) return px(-amount);
  if (to < from && index >= to && index < from) return px(amount);
  return px(0);
};

/** Project a delta onto the list's main axis. */
export const mainAxisOffset: mainAxisOffset = (delta, orientation) =>
  orientation === "vertical" ? delta.dy : delta.dx;

/**
 * Turn a keyboard-move delta into a slot step.
 *
 * Arrows along the main axis map to `-1` / `+1`; cross-axis arrows
 * map to `0` so they can be ignored gracefully.
 *
 * @example
 * ```ts
 * indexStepOf({ dx: px(0), dy: px(-10) }, "vertical");  // => -1
 * indexStepOf({ dx: px(10), dy: px(0) }, "vertical");   // => 0
 * indexStepOf({ dx: px(-10), dy: px(0) }, "horizontal"); // => -1
 * ```
 */
export const indexStepOf: indexStepOf = (delta, orientation) => {
  const offset = mainAxisOffset(delta, orientation);

  if (offset < 0) return -1;
  if (offset > 0) return 1;
  return 0;
};
