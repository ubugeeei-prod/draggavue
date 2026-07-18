import type { Position } from "../shared/geometry";

// --- Types & Signatures ---

/**
 * Every string a drag interaction exposes to assistive technology.
 *
 * Messages are plain functions over the data they describe, so they
 * compose naturally with any i18n setup — there is no template
 * micro-syntax to learn. Pass a partial override to reword or
 * localize just the strings you care about; the rest fall back to
 * {@link DEFAULT_MESSAGES}.
 *
 * @example Localizing two strings
 * ```ts
 * useDraggable(box, {
 *   a11y: {
 *     grabbed: (p) => `つかみました (${p.x}, ${p.y})`,
 *     canceled: () => "キャンセルしました。元の位置に戻ります。",
 *   },
 * });
 * ```
 *
 * @see {@link SortA11yMessages} for the list-reordering catalog.
 */
export type DragA11yMessages = {
  /** Announced when a drag session starts. */
  readonly grabbed: (position: Position) => string;
  /**
   * Announced on every keyboard move. Pointer moves stay silent by
   * design — per-frame announcements would drown a screen reader.
   */
  readonly moved: (position: Position) => string;
  /** Announced when the session commits. */
  readonly dropped: (position: Position) => string;
  /** Announced when the session is canceled. */
  readonly canceled: (position: Position) => string;
  /**
   * Usage hint linked from the handle via `aria-describedby`.
   * Identical texts share a single hidden DOM node app-wide.
   */
  readonly instructions: string;
  /** Value for `aria-roledescription` on the handle. */
  readonly roleDescription: string;
};

/**
 * The message catalog for sortable lists.
 *
 * All positions are **1-based** because they are read to humans:
 * the first row is "position 1 of 5", never "index 0".
 *
 * @see {@link DragA11yMessages} for the free-drag catalog and the
 * override mechanics (identical: partial objects merge over
 * {@link DEFAULT_SORT_MESSAGES}).
 */
export type SortA11yMessages = {
  /** Announced when an item is grabbed. */
  readonly grabbed: (position: number, total: number) => string;
  /** Announced when the grabbed item targets a new slot. */
  readonly moved: (position: number, total: number) => string;
  /** Announced on drop; `from === to` means nothing moved. */
  readonly dropped: (from: number, to: number) => string;
  /** Announced when the reorder is canceled. */
  readonly canceled: (position: number) => string;
  /** Usage hint linked from each item via `aria-describedby`. */
  readonly instructions: string;
  /** Value for `aria-roledescription` on each item. */
  readonly roleDescription: string;
};

export type describePosition = (position: Position) => string;

// --- Implementation ---

/**
 * Format a position for humans: rounded, labeled, compact.
 *
 * @example
 * ```ts
 * describePosition({ x: px(10.4), y: px(-3.6) }); // => "x 10, y -4"
 * ```
 */
export const describePosition: describePosition = (position) =>
  `x ${Math.round(position.x)}, y ${Math.round(position.y)}`;

/**
 * The English catalog used when {@link DragA11yMessages} is not
 * overridden.
 *
 * Also the merge base for partial overrides, so importing it lets
 * you reuse individual strings inside your own catalog.
 */
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

/**
 * The English catalog used when {@link SortA11yMessages} is not
 * overridden.
 */
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
