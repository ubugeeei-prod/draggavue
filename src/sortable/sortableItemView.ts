import type { SortableLayout } from "./sortable";
import { shiftFor } from "./sortable";
import type { ActiveSort } from "./useSortable.def";

// --- Types & Signatures ---

export type SortableItemStyle = {
  /** Items own their gesture, so browsers must not claim it for scrolling. */
  readonly touchAction: "none";
  readonly transform?: string;
  readonly transition?: string;
  readonly willChange?: "transform";
  readonly zIndex?: 1;
  readonly position?: "relative";
};

export type SortableItemAttrs = {
  /** Delegation key: how events find their item. */
  readonly "data-draggavue-index": number;
  readonly "data-dragging"?: "true";
  readonly role?: "button";
  readonly tabindex?: 0;
  readonly "aria-roledescription"?: string;
  readonly "aria-describedby"?: string;
};

export type SortableItemA11y = {
  readonly keyboardEnabled: boolean;
  readonly roleDescription: string;
  readonly instructionsId: string | null;
};

export type sortableItemStyle = (
  index: number,
  active: ActiveSort | null,
  layout: SortableLayout | null,
  transition: string | null,
  reduceMotion: boolean,
) => SortableItemStyle;

export type sortableItemAttrs = (
  index: number,
  active: ActiveSort | null,
  a11y: SortableItemA11y,
) => SortableItemAttrs;

// --- Implementation ---

const REST: SortableItemStyle = { touchAction: "none" };

const translated = (layout: SortableLayout, amount: number): string =>
  layout.orientation === "vertical"
    ? `translate3d(0, ${amount}px, 0)`
    : `translate3d(${amount}px, 0, 0)`;

export const sortableItemStyle: sortableItemStyle = (
  index,
  active,
  layout,
  transition,
  reduceMotion,
) => {
  if (active === null || layout === null) return REST;
  if (index === active.from) {
    return {
      touchAction: "none",
      transform: translated(layout, active.offset),
      transition: "none",
      willChange: "transform",
      zIndex: 1,
      position: "relative",
    };
  }
  const shift = shiftFor(index, active.from, active.to, layout.shift);
  const style: SortableItemStyle = {
    touchAction: "none",
    transform: translated(layout, shift),
  };
  return transition === null || reduceMotion ? style : { ...style, transition };
};

export const sortableItemAttrs: sortableItemAttrs = (index, active, a11y) => {
  const base: SortableItemAttrs = {
    "data-draggavue-index": index,
    ...(active?.from === index ? { "data-dragging": "true" as const } : {}),
  };
  if (!a11y.keyboardEnabled) return base;
  return {
    ...base,
    role: "button",
    tabindex: 0,
    "aria-roledescription": a11y.roleDescription,
    ...(a11y.instructionsId === null ? {} : { "aria-describedby": a11y.instructionsId }),
  };
};
