<script setup lang="ts">
import type { Ref } from "vue";
import { ref } from "vue";
import "../src/styles/index.css";

defineArt("../src/sortable/SortableList.vue", {
  title: "SortableList",
  category: "Components",
  tags: ["sortable", "list", "a11y"],
});

type Track = { readonly id: number; readonly title: string };

const vertical: Ref<readonly Track[]> = ref([
  { id: 1, title: "Overture" },
  { id: 2, title: "Interlude" },
  { id: 3, title: "Crescendo" },
  { id: 4, title: "Finale" },
]);

const horizontal: Ref<readonly Track[]> = ref([
  { id: 1, title: "One" },
  { id: 2, title: "Two" },
  { id: 3, title: "Three" },
]);

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
        <span class="grip" aria-hidden="true">⠿</span>
        <span>{{ index + 1 }}. {{ item.title }}</span>
      </template>
    </SortableList>
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
        <span>{{ item.title }}</span>
      </template>
    </SortableList>
  </variant>
</art>

<style scoped>
.art-preview {
  padding: 1rem;
}

.tracks {
  display: grid;
  gap: 0.5rem;
  max-width: 20rem;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    padding: 0.55rem 0.9rem;
    border: 1px solid #c9cfd6;
    border-radius: 10px;
    background: #fff;
  }
}

.columns {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    padding: 0.55rem 0.9rem;
    border: 1px solid #c9cfd6;
    border-radius: 10px;
    background: #fff;
  }
}

.grip {
  color: #8a94a1;
}
</style>
