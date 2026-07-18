import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";
import type { DraggableElement, ElementTarget } from "../shared/dom";
import { isElement, measureRect } from "../shared/dom";
import type { Axis, Grid, Position, Rect } from "../shared/geometry";
import { px } from "../shared/units";
import type { DragBounds, DragConstraints } from "./drag";

// --- Types & Signatures ---

/** Bounding option: an element, a client rect, or the direct parent. */
export type BoundsOption = DraggableElement | Rect | "parent";

export type ConstraintOptions = {
  readonly axis?: MaybeRefOrGetter<Axis | undefined>;
  readonly grid?: MaybeRefOrGetter<Grid | null | undefined>;
  readonly bounds?: MaybeRefOrGetter<BoundsOption | null | undefined>;
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
