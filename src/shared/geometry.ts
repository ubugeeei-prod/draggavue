import type { Px } from "./units";
import { px } from "./units";

// --- Types & Signatures ---

/** A point in client coordinates. */
export type Position = {
  readonly x: Px;
  readonly y: Px;
};

/** A translation between two positions. */
export type Delta = {
  readonly dx: Px;
  readonly dy: Px;
};

export type Size = {
  readonly width: Px;
  readonly height: Px;
};

/** An axis-aligned rectangle in client coordinates. */
export type Rect = {
  readonly left: Px;
  readonly top: Px;
  readonly width: Px;
  readonly height: Px;
};

/** Movement axis constraint. */
export type Axis = "both" | "x" | "y";

/** Snap grid cell size as `[x, y]` in pixels. */
export type Grid = readonly [Px, Px];

export const ORIGIN: Position = { x: px(0), y: px(0) };
export const ZERO_DELTA: Delta = { dx: px(0), dy: px(0) };

export type translate = (position: Position, delta: Delta) => Position;
export type deltaBetween = (from: Position, to: Position) => Delta;
export type magnitude = (delta: Delta) => Px;
export type constrainToAxis = (delta: Delta, axis: Axis) => Delta;
export type snapToGrid = (delta: Delta, grid: Grid) => Delta;
export type clampToRect = (position: Position, size: Size, bounds: Rect) => Position;

// --- Implementation ---

export const translate: translate = (position, delta) => ({
  x: px(position.x + delta.dx),
  y: px(position.y + delta.dy),
});

export const deltaBetween: deltaBetween = (from, to) => ({
  dx: px(to.x - from.x),
  dy: px(to.y - from.y),
});

export const magnitude: magnitude = (delta) => px(Math.hypot(delta.dx, delta.dy));

export const constrainToAxis: constrainToAxis = (delta, axis) => {
  if (axis === "x") return { dx: delta.dx, dy: px(0) };
  if (axis === "y") return { dx: px(0), dy: delta.dy };
  return delta;
};

export const snapToGrid: snapToGrid = (delta, [cellX, cellY]) => ({
  dx: px(cellX > 0 ? Math.round(delta.dx / cellX) * cellX : delta.dx),
  dy: px(cellY > 0 ? Math.round(delta.dy / cellY) * cellY : delta.dy),
});

export const clampToRect: clampToRect = (position, size, bounds) => {
  const maxX = bounds.left + bounds.width - size.width;
  const maxY = bounds.top + bounds.height - size.height;
  return {
    x: px(Math.min(Math.max(position.x, bounds.left), Math.max(bounds.left, maxX))),
    y: px(Math.min(Math.max(position.y, bounds.top), Math.max(bounds.top, maxY))),
  };
};
