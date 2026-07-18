import type { MaybeRefOrGetter } from "vue";
import type { Position, Rect } from "./geometry";
import { px } from "./units";

export type DraggableElement = HTMLElement | SVGElement;

/** Accepts `useTemplateRef()`, plain refs, getters, or raw elements. */
export type ElementTarget = MaybeRefOrGetter<DraggableElement | null | undefined>;

export type isElement = (value: unknown) => value is DraggableElement;
export type measureRect = (element: Element) => Rect;
export type pointFromEvent = (event: PointerEvent) => Position;

/** Duck-typed so elements from other realms (iframes) also pass. */
export const isElement: isElement = (value): value is DraggableElement =>
  typeof value === "object" && value !== null && "getBoundingClientRect" in value;

export const measureRect: measureRect = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    left: px(rect.left),
    top: px(rect.top),
    width: px(rect.width),
    height: px(rect.height),
  };
};

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

export const suppressUserSelect: suppressUserSelect = () => {
  if (suppressionDepth === 0) {
    previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
  }
  suppressionDepth += 1;
};

export const restoreUserSelect: restoreUserSelect = () => {
  if (suppressionDepth === 0) return;
  suppressionDepth -= 1;
  if (suppressionDepth === 0) {
    document.body.style.userSelect = previousUserSelect;
  }
};
