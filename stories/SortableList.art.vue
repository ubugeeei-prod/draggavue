<script setup lang="ts">
import type { Ref } from "vue";
import { ref } from "vue";
import "../src/styles/index.css";

defineArt("../src/sortable/SortableList.vue", {
  title: "SortableList",
  category: "Components",
  tags: ["sortable", "list", "a11y"],
});

type Track = { readonly id: number; readonly title: string; readonly length: string };

const makeTracks = (): Track[] => [
  { id: 1, title: "Overture", length: "3:12" },
  { id: 2, title: "Interlude", length: "1:47" },
  { id: 3, title: "Crescendo", length: "4:05" },
  { id: 4, title: "Finale", length: "5:21" },
];

const vertical: Ref<readonly Track[]> = ref(makeTracks());
const springy: Ref<readonly Track[]> = ref(makeTracks());
const left: Ref<readonly Track[]> = ref(makeTracks().slice(0, 3));
const right: Ref<readonly Track[]> = ref(makeTracks().slice(1));
const horizontal: Ref<readonly Track[]> = ref(makeTracks().slice(0, 3));

const trackKey = (track: Track): number => track.id;
</script>

<art>
  <variant name="Vertical" default>
    <SortableList
      class="tracks"
      :items="vertical"
      :item-key="trackKey"
      @update:items="(next) => (vertical = next)"
    >
      <template #item="{ item, index }">
        <span class="grip" aria-hidden="true"></span>
        <span class="order">{{ index + 1 }}</span>
        <span class="title">{{ item.title }}</span>
        <span class="length">{{ item.length }}</span>
      </template>
    </SortableList>
  </variant>

  <variant name="Springy neighbors">
    <p class="hint">Same list, easing swapped by <code>styles/spring.css</code> variables.</p>
    <SortableList
      class="tracks springy"
      :items="springy"
      :item-key="trackKey"
      @update:items="(next) => (springy = next)"
    >
      <template #item="{ item, index }">
        <span class="grip" aria-hidden="true"></span>
        <span class="order">{{ index + 1 }}</span>
        <span class="title">{{ item.title }}</span>
        <span class="length">{{ item.length }}</span>
      </template>
    </SortableList>
  </variant>

  <variant name="Two lists side by side">
    <div class="columns-wrap">
      <SortableList
        class="tracks"
        :items="left"
        :item-key="trackKey"
        @update:items="(next) => (left = next)"
      >
        <template #item="{ item }">
          <span class="grip" aria-hidden="true"></span>
          <span class="title">{{ item.title }}</span>
        </template>
      </SortableList>
      <SortableList
        class="tracks"
        :items="right"
        :item-key="trackKey"
        @update:items="(next) => (right = next)"
      >
        <template #item="{ item }">
          <span class="grip" aria-hidden="true"></span>
          <span class="title">{{ item.title }}</span>
        </template>
      </SortableList>
    </div>
  </variant>

  <variant name="Horizontal">
    <SortableList
      class="columns"
      orientation="horizontal"
      :items="horizontal"
      :item-key="trackKey"
      @update:items="(next) => (horizontal = next)"
    >
      <template #item="{ item }">
        <span class="title">{{ item.title }}</span>
      </template>
    </SortableList>
  </variant>
</art>

<style scoped>
.art-preview {
  --ink: oklch(0.32 0.02 265);
  --ink-soft: oklch(0.55 0.02 265);
  --line: oklch(0.91 0.01 265);
  --paper: oklch(0.995 0 0);
  --accent: oklch(0.58 0.17 275);

  padding: 1.5rem;
  color: var(--ink);
  font:
    500 0.85rem/1.4 ui-sans-serif,
    system-ui,
    sans-serif;
}

.tracks {
  display: grid;
  gap: 0.5rem;
  width: 19rem;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    display: flex;
    gap: 0.7rem;
    align-items: center;
    padding: 0.65rem 0.9rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);

    &[data-dragging="true"] {
      border-color: color-mix(in oklab, var(--accent) 45%, var(--line));
    }
  }
}

.springy :deep(li) {
  /* The spring.css preset, scoped to one list. */
  --dv-ease: linear(
    0,
    0.3204 5.8%,
    0.6738 11.6%,
    0.892 16.5%,
    1.0466 22%,
    1.1157 27.6%,
    1.1181 32.4%,
    1.0774 38.8%,
    1.0102 49.5%,
    0.9846 57.5%,
    0.9925 66.9%,
    1.0011 80.4%,
    1
  );
}

.columns-wrap {
  display: flex;
  gap: 1.25rem;
}

.columns {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    padding: 0.65rem 1rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
}

.grip {
  width: 4px;
  height: 14px;
  border-inline: 2px dotted var(--ink-soft);
  opacity: 0.7;
}

.order {
  min-width: 1.1rem;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.title {
  flex: 1;
}

.length {
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.hint {
  margin: 0 0 0.75rem;
  color: var(--ink-soft);
  font-weight: 400;

  & code {
    font:
      400 0.9em ui-monospace,
      monospace;
  }
}
</style>
