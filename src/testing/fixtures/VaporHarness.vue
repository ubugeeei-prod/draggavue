<script setup lang="ts">
import { ref } from "vue";
import { Draggable } from "../../draggable/Draggable";
import { SortableList } from "../../sortable/SortableList";

const items = ref<readonly string[]>(["a", "b", "c"]);

function keyOf(item: string): PropertyKey {
  return item;
}

function onItems(next: readonly string[]): void {
  items.value = next;
}
</script>

<template>
  <div>
    <Draggable data-harness="drag">payload</Draggable>
    <SortableList data-harness="sort" :items="items" :item-key="keyOf" @update:items="onItems">
      <template #item="{ item, index }">{{ index }}:{{ item }}</template>
    </SortableList>
  </div>
</template>
