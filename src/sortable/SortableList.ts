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

/**
 * Sortable list component — {@link useSortable} with the rendering
 * already wired.
 *
 * Fully generic: slot props carry *your* item type, inferred from
 * `items`. The list is controlled — bind `items` and apply updates
 * from `@update:items`; the component never mutates your array.
 *
 * `item-key` is required and must be stable per item. Index keys
 * would fight the reorder animation and break keyboard focus.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from "vue";
 * import { SortableList } from "draggavue";
 *
 * type Track = { id: number; title: string };
 *
 * const tracks = ref<readonly Track[]>([
 *   { id: 1, title: "Overture" },
 *   { id: 2, title: "Interlude" },
 * ]);
 *
 * const trackKey = (track: Track): number => track.id;
 * </script>
 *
 * <template>
 *   <SortableList
 *     :items="tracks"
 *     :item-key="trackKey"
 *     @update:items="(next) => (tracks = next)"
 *   >
 *     <template #item="{ item, index, isDragging }">
 *       <span>{{ index + 1 }}. {{ item.title }}</span>
 *       <em v-if="isDragging">moving…</em>
 *     </template>
 *   </SortableList>
 * </template>
 * ```
 *
 * @see {@link useSortable} when you need full control over the
 * markup.
 */
export const SortableList: SortableListComponent =
  SortableListImpl as unknown as SortableListComponent;
