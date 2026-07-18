<script setup lang="ts" generic="T">
import { useTemplateRef } from "vue";
import type { SortA11yMessages } from "../a11y/messages";
import type { Orientation } from "./sortable";
import type { SortEvent } from "./useSortable";
import { useSortable } from "./useSortable";

const {
  items,
  itemKey,
  tag = "ul",
  itemTag = "li",
  orientation = "vertical",
  disabled = false,
  activationDistance = 0,
  transition = undefined,
  keyboard = true,
  a11y = undefined,
} = defineProps<{
  /** Controlled list. Pair with `@update:items`. */
  items: readonly T[];
  /** Stable key per item — never use the index. */
  itemKey: (item: T) => PropertyKey;
  /** Rendered container element. */
  tag?: string;
  /** Rendered element per item. */
  itemTag?: string;
  orientation?: Orientation;
  disabled?: boolean;
  activationDistance?: number;
  /** Transition for shifting neighbors. `false` disables it. */
  transition?: string | false;
  keyboard?: boolean;
  a11y?: Partial<SortA11yMessages> | false;
}>();

const emit = defineEmits<{
  "update:items": [items: readonly T[], event: SortEvent];
  "sort:start": [event: SortEvent];
  "sort:move": [event: SortEvent];
  "sort:end": [event: SortEvent];
  "sort:cancel": [event: SortEvent];
}>();

defineSlots<{
  item: (props: { item: T; index: number; isDragging: boolean }) => unknown;
}>();

const list = useTemplateRef<HTMLElement>("list");

const sortable = useSortable(list, {
  items: () => items,
  onReorder: (next, event) => emit("update:items", next, event),
  orientation: () => orientation,
  disabled: () => disabled,
  activationDistance: () => activationDistance,
  transition,
  keyboard,
  a11y,
  onSortStart: (event) => emit("sort:start", event),
  onSortMove: (event) => emit("sort:move", event),
  onSortEnd: (event) => emit("sort:end", event),
  onSortCancel: (event) => emit("sort:cancel", event),
});

const active = sortable.active;
const itemStyle = sortable.itemStyle;
const itemAttrs = sortable.itemAttrs;

defineExpose({
  /** Root DOM element. */
  element: list,
  cancel: sortable.cancel,
  isSorting: sortable.isSorting,
});
</script>

<template>
  <component :is="tag" ref="list">
    <component
      :is="itemTag"
      v-for="(item, index) in items"
      :key="itemKey(item)"
      v-bind="itemAttrs(index)"
      :style="itemStyle(index)"
    >
      <slot name="item" :item="item" :index="index" :is-dragging="active?.from === index" />
    </component>
  </component>
</template>
