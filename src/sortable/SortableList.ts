import type { SortA11yMessages } from "../a11y/messages";
import type { Orientation } from "./sortable";
import type { SortEvent } from "./useSortable.def";
import SortableListImpl from "./SortableList.vue";

// --- Types & Signatures ---

export interface SortableListProps<T> {
  /** Controlled list. Pair with `@update:items`. */
  items: readonly T[];
  /** Stable key per item — never use the index. */
  itemKey: (item: T) => PropertyKey;
  /** Rendered container element. @default "ul" */
  tag?: string;
  /** Rendered element per item. @default "li" */
  itemTag?: string;
  /** @default "vertical" */
  orientation?: Orientation;
  /** @default false */
  disabled?: boolean;
  /** @default 0 */
  activationDistance?: number;
  /** Transition for shifting neighbors. @default "transform 200ms ease" */
  transition?: string | false;
  /** @default true */
  keyboard?: boolean;
  a11y?: Partial<SortA11yMessages> | false;
  "onUpdate:items"?: (items: readonly T[], event: SortEvent) => void;
  "onSort:start"?: (event: SortEvent) => void;
  "onSort:move"?: (event: SortEvent) => void;
  "onSort:end"?: (event: SortEvent) => void;
  "onSort:cancel"?: (event: SortEvent) => void;
}

export interface SortableListItemSlotProps<T> {
  item: T;
  index: number;
  isDragging: boolean;
}

/** Instance surface reachable through a template ref. */
export interface SortableListExposed {
  readonly element: HTMLElement | null;
  readonly isSorting: boolean;
  cancel(): void;
}

/**
 * Hand-written public contract for the generic SFC implementation.
 *
 * The generic constructor keeps per-item type inference in consumer
 * templates (`item` in the slot is your `T`). Verified against the
 * implementation by `vize check`; replaced once Vize emits SFC
 * declarations natively.
 */
export interface SortableListComponent {
  new <T>(props: SortableListProps<T>): {
    $props: SortableListProps<T>;
    $slots: { item: (props: SortableListItemSlotProps<T>) => unknown };
  } & SortableListExposed;
}

// --- Implementation ---

export const SortableList: SortableListComponent =
  SortableListImpl as unknown as SortableListComponent;
