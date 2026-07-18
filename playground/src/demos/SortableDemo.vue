<script setup lang="ts">
import type { Ref } from "vue";
import { ref } from "vue";
import { SortableList } from "draggavue";

type Track = { readonly id: number; readonly title: string; readonly length: string };

const tracks: Ref<readonly Track[]> = ref([
  { id: 1, title: "Overture", length: "3:12" },
  { id: 2, title: "Interlude", length: "1:47" },
  { id: 3, title: "Crescendo", length: "4:05" },
  { id: 4, title: "Reprise", length: "2:58" },
  { id: 5, title: "Finale", length: "5:21" },
]);

const trackKey = (track: Track): number => track.id;
</script>

<template>
  <section>
    <h2>Sortable — <code>&lt;SortableList&gt;</code></h2>
    <p>
      Reorder with a pointer, or focus a row and press <kbd>Space</kbd>, move with the arrow keys,
      drop with <kbd>Space</kbd>. Changes are announced to screen readers.
    </p>
    <SortableList
      class="tracks"
      :items="tracks"
      :item-key="trackKey"
      @update:items="(next) => (tracks = next)"
    >
      <template #item="{ item, index, isDragging }">
        <span class="grip" aria-hidden="true">⠿</span>
        <span class="order">{{ index + 1 }}</span>
        <span class="title">{{ item.title }}</span>
        <span class="length">{{ isDragging ? "moving…" : item.length }}</span>
      </template>
    </SortableList>
  </section>
</template>

<style scoped>
.tracks {
  display: grid;
  gap: 0.5rem;
  max-width: 28rem;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.6rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    cursor: grab;

    &[data-dragging="true"] {
      cursor: grabbing;
      border-color: var(--color-primary);
      box-shadow: var(--shadow-lift);
    }
  }
}

.grip {
  color: var(--color-text-muted);
}

.order {
  min-width: 1.25rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.title {
  flex: 1;
}

.length {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
