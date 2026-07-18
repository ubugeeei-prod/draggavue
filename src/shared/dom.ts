import type { MaybeRefOrGetter } from "vue";
import type { Position, Rect } from "./geometry";
import { px } from "./units";

/**
 * Anything draggavue can move: regular HTML elements and inline SVG
 * elements alike (both carry geometry, inline styles, and pointer
 * events).
 */
export type DraggableElement = HTMLElement | SVGElement;

/**
 * How composables accept their target element.
 *
 * Any of these work, and the element may appear or be swapped after
 * mount — the composables re-wire themselves reactively:
 *
 * - a `useTemplateRef()` result (the idiomatic choice)
 * - any `Ref<Element | null>`
 * - a getter returning the element
 * - a raw element
 *
 * @example The idiomatic template-ref flow
 * ```ts
 * const box = useTemplateRef<HTMLElement>("box");
 * const drag = useDraggable(box);
 * ```
 */
export type ElementTarget = MaybeRefOrGetter<DraggableElement | null | undefined>;

export type isElement = (value: unknown) => value is DraggableElement;
export type measureRect = (element: Element) => Rect;
export type pointFromEvent = (event: PointerEvent) => Position;

/**
 * Whether a value is a usable element.
 *
 * Duck-typed on `getBoundingClientRect` rather than `instanceof`,
 * so elements from other realms (iframes, popups) pass too.
 */
export const isElement: isElement = (value): value is DraggableElement =>
  typeof value === "object" && value !== null && "getBoundingClientRect" in value;

/**
 * Snapshot an element's client rect as a branded {@link Rect}.
 *
 * One structured read per call — call it at session boundaries,
 * never per frame.
 */
export const measureRect: measureRect = (element) => {
  const rect = element.getBoundingClientRect();

  return {
    left: px(rect.left),
    top: px(rect.top),
    width: px(rect.width),
    height: px(rect.height),
  };
};

/** A pointer event's client coordinates as a branded {@link Position}. */
export const pointFromEvent: pointFromEvent = (event) => ({
  x: px(event.clientX),
  y: px(event.clientY),
});

// Text-selection suppression is global (one <body>), so overlapping
// sessions from multiple composable instances share a counter.
let suppressionDepth = 0;
let previousUserSelect = "";

export type suppressUserSelect = () => void;
export type restoreUserSelect = () => void;

/**
 * Suppress text selection for the duration of a drag.
 *
 * Ref-counted: concurrent sessions (multi-touch across several
 * draggables) each take a lease, and the original inline
 * `user-select` is restored only when the last lease is released
 * by {@link restoreUserSelect}.
 */
export const suppressUserSelect: suppressUserSelect = () => {
  if (suppressionDepth === 0) {
    previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
  }

  suppressionDepth += 1;
};

/**
 * Release one {@link suppressUserSelect} lease.
 *
 * Calling it without a matching lease is a safe no-op, so teardown
 * paths can invoke it unconditionally.
 */
export const restoreUserSelect: restoreUserSelect = () => {
  if (suppressionDepth === 0) return;

  suppressionDepth -= 1;
  if (suppressionDepth === 0) {
    document.body.style.userSelect = previousUserSelect;
  }
};
