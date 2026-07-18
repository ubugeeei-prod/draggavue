<script setup lang="ts" generic="T">
import { computed, useTemplateRef } from "vue";
import type { SortA11yMessages } from "../a11y/messages";
import type { Orientation } from "./sortable";
import type { SortEvent } from "./useSortable";
import { useSortable } from "./useSortable";

// Not destructured on purpose: destructured props compile to an
// empty render under Vize's Vapor mode today. Revert to the style
// guide's destructure once ubugeeei-prod/vize#3072 ships. Defaults
// live in the composable, which treats undefined as "use default".
const props = defineProps<{
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
  items: () => props.items,
  onReorder: (next, event) => emit("update:items", next, event),
  orientation: () => props.orientation,
  disabled: () => props.disabled,
  activationDistance: () => props.activationDistance,
  transition: props.transition,
  keyboard: props.keyboard,
  a11y: props.a11y,
  onSortStart: (event) => emit("sort:start", event),
  onSortMove: (event) => emit("sort:move", event),
  onSortEnd: (event) => emit("sort:end", event),
  onSortCancel: (event) => emit("sort:cancel", event),
});

const active = sortable.active;
const itemStyle = sortable.itemStyle;
const itemAttrs = sortable.itemAttrs;

// Template avoids `props.*` too — Vapor compiles those references
// to a `_ctx.props` that does not exist (same tracking issue).
const rootTag = computed(() => props.tag ?? "ul");
const itemTag = computed(() => props.itemTag ?? "li");
const items = computed(() => props.items);

function itemKeyOf(item: T): PropertyKey {
  return props.itemKey(item);
}

defineExpose({
  /** Root DOM element. */
  element: list,
  cancel: sortable.cancel,
  isSorting: sortable.isSorting,
});
</script>

<template>
  <component :is="rootTag" ref="list">
    <component
      :is="itemTag"
      v-for="(item, index) in items"
      :key="itemKeyOf(item)"
      v-bind="itemAttrs(index)"
      :style="itemStyle(index)"
    >
      <slot name="item" :item="item" :index="index" :is-dragging="active?.from === index" />
    </component>
  </component>
</template>
