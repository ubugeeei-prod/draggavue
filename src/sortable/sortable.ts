import type { Delta, Rect } from "../shared/geometry";
import type { Px } from "../shared/units";
import { px } from "../shared/units";

// --- Types & Signatures ---

export type Orientation = "vertical" | "horizontal";

/**
 * Geometry of a list captured once at session start. Everything the
 * reorder math needs, with the DOM already left behind.
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

/** Move one item to a new index, returning a fresh array. */
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
 * Capture list geometry. The shift distance assumes the roughly
 * uniform gaps of a real list; it is measured between the dragged
 * item and its nearest neighbor.
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
 * Where the dragged item belongs right now: the first center it
 * passed while moving up, or the last center it passed while moving
 * down. `offset` is the dragged item's main-axis translation.
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

/** How far a resting item shifts while `from` is hovering at `to`. */
export const shiftFor: shiftFor = (index, from, to, amount) => {
  if (from < to && index > from && index <= to) return px(-amount);
  if (to < from && index >= to && index < from) return px(amount);
  return px(0);
};

export const mainAxisOffset: mainAxisOffset = (delta, orientation) =>
  orientation === "vertical" ? delta.dy : delta.dx;

/** Keyboard arrows move the dragged item one slot along the list. */
export const indexStepOf: indexStepOf = (delta, orientation) => {
  const offset = mainAxisOffset(delta, orientation);
  if (offset < 0) return -1;
  if (offset > 0) return 1;
  return 0;
};
