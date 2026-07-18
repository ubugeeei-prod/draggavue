import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";
import type { DraggableElement, ElementTarget } from "../shared/dom";
import { isElement, measureRect } from "../shared/dom";
import type { Axis, Grid, Position, Rect } from "../shared/geometry";
import { px } from "../shared/units";
import type { DragBounds, DragConstraints } from "./drag";

// --- Types & Signatures ---

/**
 * Where a dragged element is allowed to travel.
 *
 * - an element — stay inside that element's client rect
 * - a {@link Rect} — stay inside a fixed client-coordinate rect
 * - `"parent"` — stay inside the target's direct parent element
 */
export type BoundsOption = DraggableElement | Rect | "parent";

/**
 * Movement constraints shared by every drag flavor. Each option
 * accepts a plain value, a ref, or a getter; the current value is
 * snapshotted once when a session starts, so a mid-drag change
 * applies to the next session.
 */
export type ConstraintOptions = {
  /**
   * Constrain movement to one axis.
   *
   * @default "both"
   */
  readonly axis?: MaybeRefOrGetter<Axis | undefined>;
  /**
   * Snap movement to a `[x, y]` pixel grid, e.g. `[px(24), px(24)]`.
   * Applied to the delta (relative to where the drag started), after
   * the axis lock and before the bounds clamp. A zero-sized cell
   * leaves that component free.
   *
   * @default null
   */
  readonly grid?: MaybeRefOrGetter<Grid | null | undefined>;
  /**
   * Keep the element fully inside the given bounds while dragging.
   * Geometry is measured once at session start — cheap per frame,
   * but bounds that resize mid-drag are picked up next session.
   *
   * @default null
   */
  readonly bounds?: MaybeRefOrGetter<BoundsOption | null | undefined>;
  /**
   * Pixels the pointer must travel before the drag activates.
   * Below the threshold the press stays an ordinary click — useful
   * for draggable elements that also contain interactive content.
   *
   * @default 0
   */
  readonly activationDistance?: MaybeRefOrGetter<number | undefined>;
};

export type resolveConstraints = (
  target: ElementTarget,
  options: ConstraintOptions,
  current: Position,
) => DragConstraints;

// --- Implementation ---

export const FREE_CONSTRAINTS: DragConstraints = {
  axis: "both",
  grid: null,
  bounds: null,
  activationDistance: px(0),
};

const containerRectOf = (raw: BoundsOption, element: DraggableElement): Rect | null => {
  if (raw === "parent") {
    const parent = element.parentElement;
    return parent === null ? null : measureRect(parent);
  }
  return isElement(raw) ? measureRect(raw) : raw;
};

/**
 * Bounds are measured in "offset space": the container rect shifted
 * by the element's untranslated page position. The pure layer can
 * then clamp offsets without ever touching the DOM.
 */
const resolveBounds = (
  target: ElementTarget,
  option: MaybeRefOrGetter<BoundsOption | null | undefined> | undefined,
  current: Position,
): DragBounds | null => {
  const element = toValue(target);
  const raw = toValue(option) ?? null;
  if (element === null || element === undefined || raw === null) return null;
  const containerRect = containerRectOf(raw, element);
  if (containerRect === null) return null;
  const elementRect = measureRect(element);
  return {
    rect: {
      left: px(containerRect.left - (elementRect.left - current.x)),
      top: px(containerRect.top - (elementRect.top - current.y)),
      width: containerRect.width,
      height: containerRect.height,
    },
    size: { width: elementRect.width, height: elementRect.height },
  };
};

/** Snapshot every constraint once, at session start. */
export const resolveConstraints: resolveConstraints = (target, options, current) => ({
  axis: toValue(options.axis) ?? "both",
  grid: toValue(options.grid) ?? null,
  bounds: resolveBounds(target, options.bounds, current),
  activationDistance: px(toValue(options.activationDistance) ?? 0),
});
