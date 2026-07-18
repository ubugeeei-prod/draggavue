import type { Position } from "../shared/geometry";

// --- Types & Signatures ---

/**
 * Every string a drag interaction exposes to assistive technology.
 * Swap the whole object (or a subset) to localize or reword.
 */
export type DragA11yMessages = {
  /** Announced when a drag session starts. */
  readonly grabbed: (position: Position) => string;
  /** Announced on every keyboard move (pointer moves stay silent). */
  readonly moved: (position: Position) => string;
  /** Announced when the session commits. */
  readonly dropped: (position: Position) => string;
  /** Announced when the session is canceled. */
  readonly canceled: (position: Position) => string;
  /** Screen-reader usage hint linked via `aria-describedby`. */
  readonly instructions: string;
  /** Value for `aria-roledescription` on the handle. */
  readonly roleDescription: string;
};

/**
 * Messages for sortable lists. Positions are 1-based because they
 * are read to humans.
 */
export type SortA11yMessages = {
  readonly grabbed: (position: number, total: number) => string;
  readonly moved: (position: number, total: number) => string;
  readonly dropped: (from: number, to: number) => string;
  readonly canceled: (position: number) => string;
  readonly instructions: string;
  readonly roleDescription: string;
};

export type describePosition = (position: Position) => string;

// --- Implementation ---

export const describePosition: describePosition = (position) =>
  `x ${Math.round(position.x)}, y ${Math.round(position.y)}`;

export const DEFAULT_MESSAGES: DragA11yMessages = {
  grabbed: (position) => `Grabbed draggable item at ${describePosition(position)}.`,
  moved: (position) => `Moved to ${describePosition(position)}.`,
  dropped: (position) => `Dropped at ${describePosition(position)}.`,
  canceled: () => "Drag canceled. Position restored.",
  instructions:
    "Press space or enter to grab the item. " +
    "While grabbed, use the arrow keys to move it, " +
    "space or enter to drop, escape to cancel.",
  roleDescription: "draggable",
};

export const DEFAULT_SORT_MESSAGES: SortA11yMessages = {
  grabbed: (position, total) => `Grabbed item at position ${position} of ${total}.`,
  moved: (position, total) => `Moved to position ${position} of ${total}.`,
  dropped: (from, to) =>
    from === to
      ? `Dropped back at position ${from}.`
      : `Dropped. Moved from position ${from} to position ${to}.`,
  canceled: (position) => `Reorder canceled. Item stays at position ${position}.`,
  instructions:
    "Press space or enter to grab the item. " +
    "While grabbed, use the arrow keys to move it within the list, " +
    "space or enter to drop, escape to cancel.",
  roleDescription: "sortable item",
};
