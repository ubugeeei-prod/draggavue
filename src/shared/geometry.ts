import type { Px } from "./units";
import { px } from "./units";

// --- Types & Signatures ---

/**
 * A point in client coordinates.
 *
 * Positions are immutable value objects: every operation returns a
 * fresh one, so a `Position` you hold can never change underneath
 * you — safe to store, compare, and replay.
 */
export type Position = {
  readonly x: Px;
  readonly y: Px;
};

/**
 * A translation between two positions.
 *
 * Deltas are directional: {@link deltaBetween} produces the delta
 * that carries its first argument onto its second, and
 * {@link translate} applies one.
 */
export type Delta = {
  readonly dx: Px;
  readonly dy: Px;
};

/** Width and height of a box, in pixels. */
export type Size = {
  readonly width: Px;
  readonly height: Px;
};

/**
 * An axis-aligned rectangle in client coordinates.
 *
 * The same shape `getBoundingClientRect()` reports, reduced to the
 * four fields drag math needs.
 */
export type Rect = {
  readonly left: Px;
  readonly top: Px;
  readonly width: Px;
  readonly height: Px;
};

/**
 * Movement axis constraint.
 *
 * - `"both"` — move freely
 * - `"x"` — the vertical component is zeroed
 * - `"y"` — the horizontal component is zeroed
 *
 * @see {@link constrainToAxis} for the operation itself.
 */
export type Axis = "both" | "x" | "y";

/**
 * Snap grid cell size as `[x, y]` in pixels.
 *
 * A zero-sized cell leaves that component free, so
 * `[px(24), px(0)]` snaps horizontally while vertical movement
 * stays smooth.
 *
 * @see {@link snapToGrid} for the operation itself.
 */
export type Grid = readonly [Px, Px];

/**
 * `{ x: 0, y: 0 }` — the default settled position.
 *
 * @see {@link ZERO_DELTA} for its delta counterpart.
 */
export const ORIGIN: Position = { x: px(0), y: px(0) };

/**
 * `{ dx: 0, dy: 0 }` — the delta of a session that has not moved.
 *
 * @see {@link ORIGIN} for its position counterpart.
 */
export const ZERO_DELTA: Delta = { dx: px(0), dy: px(0) };

export type translate = (position: Position, delta: Delta) => Position;
export type deltaBetween = (from: Position, to: Position) => Delta;
export type magnitude = (delta: Delta) => Px;
export type constrainToAxis = (delta: Delta, axis: Axis) => Delta;
export type snapToGrid = (delta: Delta, grid: Grid) => Delta;
export type clampToRect = (position: Position, size: Size, bounds: Rect) => Position;

// --- Implementation ---

/**
 * Move a position by a delta.
 *
 * @example
 * ```ts
 * translate({ x: px(10), y: px(20) }, { dx: px(5), dy: px(-8) });
 * // => { x: 15, y: 12 }
 * ```
 *
 * @see {@link deltaBetween} — the inverse operation.
 */
export const translate: translate = (position, delta) => ({
  x: px(position.x + delta.dx),
  y: px(position.y + delta.dy),
});

/**
 * The delta that carries `from` onto `to`.
 *
 * Inverse of {@link translate}:
 * `translate(from, deltaBetween(from, to))` equals `to` for any two
 * positions.
 *
 * @example
 * ```ts
 * deltaBetween({ x: px(10), y: px(20) }, { x: px(4), y: px(26) });
 * // => { dx: -6, dy: 6 }
 * ```
 */
export const deltaBetween: deltaBetween = (from, to) => ({
  dx: px(to.x - from.x),
  dy: px(to.y - from.y),
});

/**
 * Euclidean length of a delta.
 *
 * Used for activation distances: how far a pointer traveled from
 * its press point, regardless of direction.
 *
 * @example
 * ```ts
 * magnitude({ dx: px(3), dy: px(4) }); // => 5
 * ```
 */
export const magnitude: magnitude = (delta) => px(Math.hypot(delta.dx, delta.dy));

/**
 * Zero out the component excluded by the axis constraint.
 *
 * `"both"` returns the delta untouched (same reference — cheap to
 * call unconditionally).
 *
 * @example
 * ```ts
 * constrainToAxis({ dx: px(12), dy: px(-7) }, "x"); // => { dx: 12, dy: 0 }
 * constrainToAxis({ dx: px(12), dy: px(-7) }, "y"); // => { dx: 0, dy: -7 }
 * ```
 */
export const constrainToAxis: constrainToAxis = (delta, axis) => {
  if (axis === "x") return { dx: delta.dx, dy: px(0) };
  if (axis === "y") return { dx: px(0), dy: delta.dy };
  return delta;
};

/**
 * Snap each delta component to the nearest grid cell.
 *
 * Snapping applies to *deltas*, not absolute positions: the element
 * moves in grid steps relative to where the drag started, which is
 * what direct manipulation intuitively feels like. Halfway points
 * round to the nearest cell (`Math.round` semantics), and negative
 * deltas snap symmetrically.
 *
 * @example
 * ```ts
 * const grid: Grid = [px(10), px(25)];
 *
 * snapToGrid({ dx: px(14), dy: px(37) }, grid);   // => { dx: 10, dy: 25 }
 * snapToGrid({ dx: px(-14), dy: px(-38) }, grid); // => { dx: -10, dy: -50 }
 * ```
 *
 * @see {@link Grid} for the zero-cell escape hatch.
 */
export const snapToGrid: snapToGrid = (delta, [cellX, cellY]) => ({
  dx: px(cellX > 0 ? Math.round(delta.dx / cellX) * cellX : delta.dx),
  dy: px(cellY > 0 ? Math.round(delta.dy / cellY) * cellY : delta.dy),
});

/**
 * Clamp a position so an element of `size` stays fully inside
 * `bounds`.
 *
 * Both edges are respected: the element can neither poke out past
 * the bottom-right nor be dragged beyond the top-left. An element
 * *larger* than the bounds pins to the bounds origin instead of
 * oscillating between corners.
 *
 * @example
 * ```ts
 * const size: Size = { width: px(20), height: px(10) };
 * const bounds: Rect = { left: px(0), top: px(0), width: px(100), height: px(50) };
 *
 * clampToRect({ x: px(95), y: px(45) }, size, bounds); // => { x: 80, y: 40 }
 * clampToRect({ x: px(-5), y: px(-5) }, size, bounds); // => { x: 0, y: 0 }
 * ```
 */
export const clampToRect: clampToRect = (position, size, bounds) => {
  const maxX = bounds.left + bounds.width - size.width;
  const maxY = bounds.top + bounds.height - size.height;

  return {
    x: px(Math.min(Math.max(position.x, bounds.left), Math.max(bounds.left, maxX))),
    y: px(Math.min(Math.max(position.y, bounds.top), Math.max(bounds.top, maxY))),
  };
};
