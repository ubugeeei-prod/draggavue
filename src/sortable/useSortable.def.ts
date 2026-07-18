import type { ComputedRef, MaybeRefOrGetter } from "vue";
import type { SortA11yMessages } from "../a11y/messages";
import type { Px } from "../shared/units";
import type { Orientation } from "./sortable";
import type { SortableItemAttrs, SortableItemStyle } from "./sortableItemView";

/** A live reorder session, exposed for rendering. */
export type ActiveSort = {
  readonly from: number;
  /** Index the item currently belongs to. */
  readonly to: number;
  /** Main-axis translation of the dragged item. */
  readonly offset: Px;
};

export type SortEvent = {
  readonly from: number;
  readonly to: number;
};

export interface UseSortableOptions<T> {
  /** Source of truth for the list (controlled). */
  items: MaybeRefOrGetter<readonly T[]>;
  /** Receives the reordered array when a session commits. */
  onReorder: (items: readonly T[], event: SortEvent) => void;
  orientation?: MaybeRefOrGetter<Orientation | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  activationDistance?: MaybeRefOrGetter<number | undefined>;
  /** Transition for shifting neighbors. `false` disables it. */
  transition?: string | false | undefined;
  a11y?: Partial<SortA11yMessages> | false | undefined;
  /** Set to `false` to opt out of keyboard reordering. */
  keyboard?: boolean | undefined;
  onSortStart?: ((event: SortEvent) => void) | undefined;
  onSortMove?: ((event: SortEvent) => void) | undefined;
  onSortEnd?: ((event: SortEvent) => void) | undefined;
  onSortCancel?: ((event: SortEvent) => void) | undefined;
}

export interface UseSortableReturn {
  active: ComputedRef<ActiveSort | null>;
  isSorting: ComputedRef<boolean>;
  /** Style for the item rendered at `index` — bind via `:style`. */
  itemStyle: (index: number) => SortableItemStyle;
  /** Attributes for the item at `index` — bind via `v-bind`. */
  itemAttrs: (index: number) => SortableItemAttrs;
  cancel: () => void;
}
