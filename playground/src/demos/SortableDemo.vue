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
      Drag rows to reorder, or focus one and press <kbd>Space</kbd>, steer with the arrows, drop
      with <kbd>Space</kbd>. Every move is announced to screen readers.
    </p>
    <SortableList
      class="setlist"
      :items="tracks"
      :item-key="trackKey"
      @update:items="(next) => (tracks = next)"
    >
      <template #item="{ item, index }">
        <span class="grip" aria-hidden="true"></span>
        <span class="order">{{ index + 1 }}</span>
        <span class="name">{{ item.title }}</span>
        <span class="time">{{ item.length }}</span>
      </template>
    </SortableList>
  </section>
</template>

<style scoped>
section > h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 650;

  & code {
    color: var(--ink-2);
    font:
      500 14px ui-monospace,
      monospace;
  }
}

section > p {
  margin: 0 0 16px;
  color: var(--ink-2);
  font-size: 13px;
  line-height: 1.6;
}

.setlist {
  display: grid;

  /* 6px between rows: siblings of one list sit close; the free
   * cards elsewhere use 12px because they are separate things. */
  gap: 6px;
  max-width: 320px;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--card);
    font-size: 13px;
    font-weight: 500;
    transition: border-color 160ms var(--ease);

    &:hover {
      border-color: var(--line-hover);
    }

    &[data-dragging="true"] {
      border-color: color-mix(in oklab, var(--accent) 55%, var(--line));
    }
  }
}

.grip {
  width: 3px;
  height: 14px;
  border-inline: 2px dotted var(--ink-2);
  opacity: 0.65;
}

.order {
  min-width: 14px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.time {
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

kbd {
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--card);
  font: inherit;
}
</style>
