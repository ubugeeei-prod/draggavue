import type { ComputedRef, MaybeRefOrGetter } from "vue";
import type { SortA11yMessages } from "../a11y/messages";
import type { Px } from "../shared/units";
import type { Orientation } from "./sortable";
import type { SortableItemAttrs, SortableItemStyle } from "./sortableItemView";

/**
 * A live reorder session, exposed for rendering.
 *
 * `null` between sessions. While non-null, `from` never changes,
 * `to` tracks the slot the item would land in if dropped now, and
 * `offset` is the dragged item's main-axis translation.
 */
export type ActiveSort = {
  readonly from: number;
  /** Index the item currently belongs to. */
  readonly to: number;
  /** Main-axis translation of the dragged item. */
  readonly offset: Px;
};

/**
 * Source and destination of a reorder, as 0-based indices.
 *
 * On `onSortEnd` / `update:items`, `from === to` never happens —
 * a drop back onto the origin fires no reorder at all.
 */
export type SortEvent = {
  readonly from: number;
  readonly to: number;
};

export interface UseSortableOptions<T> {
  /**
   * Source of truth for the list. The composable only ever *reads*
   * it — reordering flows back through {@link onReorder}, keeping
   * the data controlled by you.
   */
  items: MaybeRefOrGetter<readonly T[]>;
  /**
   * Receives the reordered array when a session commits with a
   * changed order. Write it back to your state (or reject it — the
   * list is yours).
   *
   * @example
   * ```ts
   * onReorder: (next) => {
   *   items.value = next;
   * }
   * ```
   */
  onReorder: (items: readonly T[], event: SortEvent) => void;
  /**
   * The list's main axis.
   *
   * @default "vertical"
   */
  orientation?: MaybeRefOrGetter<Orientation | undefined>;
  /**
   * Reactively disable reordering. Turning this on mid-session
   * cancels the session.
   *
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  /**
   * Pixels the pointer must travel before the reorder activates.
   * Below the threshold the press stays an ordinary click.
   *
   * @default 0
   */
  activationDistance?: MaybeRefOrGetter<number | undefined>;
  /**
   * CSS `transition` applied to *resting* items while they shift to
   * make room. The dragged item always moves without transition.
   * Automatically dropped under `prefers-reduced-motion`.
   *
   * Set to `false` to disable, or provide any transition string.
   * The default references `--dv-ease` so loading the opt-in
   * stylesheet upgrades the easing automatically; without it the
   * `var()` falls back to plain `ease`.
   *
   * @default "transform 180ms var(--dv-ease, ease)"
   */
  transition?: string | false | undefined;
  /**
   * Override or disable assistive-technology messages. A partial
   * object merges over {@link DEFAULT_SORT_MESSAGES}; `false`
   * silences announcements entirely.
   *
   * @default DEFAULT_SORT_MESSAGES
   */
  a11y?: Partial<SortA11yMessages> | false | undefined;
  /**
   * Set to `false` to opt out of keyboard reordering — which also
   * removes the `role` / `tabindex` affordances from items.
   *
   * @default true
   */
  keyboard?: boolean | undefined;
  /** Fired when a session activates. */
  onSortStart?: ((event: SortEvent) => void) | undefined;
  /** Fired whenever the target slot changes mid-session. */
  onSortMove?: ((event: SortEvent) => void) | undefined;
  /** Fired when a session commits (even if nothing moved). */
  onSortEnd?: ((event: SortEvent) => void) | undefined;
  /** Fired when a session is canceled. */
  onSortCancel?: ((event: SortEvent) => void) | undefined;
}

export interface UseSortableReturn {
  /** The live session, or `null` at rest. */
  active: ComputedRef<ActiveSort | null>;
  isSorting: ComputedRef<boolean>;
  /**
   * Style for the item rendered at `index` — bind via `:style`.
   * Carries the drag/shift transforms, the neighbor transition, and
   * `touch-action: none`.
   */
  itemStyle: (index: number) => SortableItemStyle;
  /**
   * Attributes for the item at `index` — bind via `v-bind`.
   * Carries the delegation index, ARIA affordances, and the
   * `data-dragging` styling hook.
   */
  itemAttrs: (index: number) => SortableItemAttrs;
  /** Cancel the active session, restoring the resting order. */
  cancel: () => void;
}
