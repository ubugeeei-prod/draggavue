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

const setlist: Ref<readonly Track[]> = ref(makeTracks());
const springy: Ref<readonly Track[]> = ref(makeTracks());
const saturday: Ref<readonly Track[]> = ref(makeTracks().slice(0, 3));
const sunday: Ref<readonly Track[]> = ref(makeTracks().slice(1));
const stops: Ref<readonly Track[]> = ref(makeTracks().slice(0, 3));

const trackKey = (track: Track): number => track.id;
</script>

<art>
  <variant name="Setlist" default>
    <p class="hint">Drag rows, or focus one — <kbd>Space</kbd>, arrows, <kbd>Space</kbd>.</p>
    <SortableList
      class="setlist"
      :items="setlist"
      :item-key="trackKey"
      @update:items="(next) => (setlist = next)"
    >
      <template #item="{ item, index }">
        <span class="grip" aria-hidden="true"></span>
        <span class="order">{{ index + 1 }}</span>
        <span class="name">{{ item.title }}</span>
        <span class="time">{{ item.length }}</span>
      </template>
    </SortableList>
  </variant>

  <variant name="Springy neighbors">
    <p class="hint">
      The same list with <code>styles/spring.css</code> physics, scoped to this subtree.
    </p>
    <SortableList
      class="setlist springy"
      :items="springy"
      :item-key="trackKey"
      @update:items="(next) => (springy = next)"
    >
      <template #item="{ item, index }">
        <span class="grip" aria-hidden="true"></span>
        <span class="order">{{ index + 1 }}</span>
        <span class="name">{{ item.title }}</span>
        <span class="time">{{ item.length }}</span>
      </template>
    </SortableList>
  </variant>

  <variant name="Two independent lists">
    <div class="days">
      <section>
        <h3 class="day">Saturday</h3>
        <SortableList
          class="setlist"
          :items="saturday"
          :item-key="trackKey"
          @update:items="(next) => (saturday = next)"
        >
          <template #item="{ item }">
            <span class="grip" aria-hidden="true"></span>
            <span class="name">{{ item.title }}</span>
          </template>
        </SortableList>
      </section>
      <section>
        <h3 class="day">Sunday</h3>
        <SortableList
          class="setlist"
          :items="sunday"
          :item-key="trackKey"
          @update:items="(next) => (sunday = next)"
        >
          <template #item="{ item }">
            <span class="grip" aria-hidden="true"></span>
            <span class="name">{{ item.title }}</span>
          </template>
        </SortableList>
      </section>
    </div>
  </variant>

  <variant name="Horizontal">
    <SortableList
      class="stops"
      orientation="horizontal"
      :items="stops"
      :item-key="trackKey"
      @update:items="(next) => (stops = next)"
    >
      <template #item="{ item }">
        <span class="name">{{ item.title }}</span>
      </template>
    </SortableList>
  </variant>
</art>

<style scoped>
.musea-variant {
  /* Same ink-on-paper tokens as the Draggable stories — one
   * product, one light. See Draggable.art.vue for the reasoning
   * behind each value. */
  --ink: oklch(0.28 0.022 272);
  --ink-2: oklch(0.51 0.02 272);
  --line: oklch(0.9 0.008 272);
  --line-hover: oklch(0.82 0.012 272);
  --paper: oklch(0.985 0.002 272);
  --card: oklch(1 0 0);
  --accent: oklch(0.54 0.19 265);

  padding: 24px;
  background: var(--paper);
  color: var(--ink);
  font:
    500 13px/1.5 ui-sans-serif,
    system-ui,
    sans-serif;
}

.setlist {
  display: grid;

  /* 6px, tighter than the free cards' 12px: rows of one list are
   * siblings, and the gap must say so. Wide gaps read as separate
   * things — bad for a list you reorder as a whole. */
  gap: 6px;
  width: 288px;
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
    transition: border-color 160ms cubic-bezier(0.2, 0, 0, 1);

    /* Hover answers only at the boundary (see Draggable stories:
     * nothing may move under an approaching pointer). */
    &:hover {
      border-color: var(--line-hover);
    }

    &[data-dragging="true"] {
      border-color: color-mix(in oklab, var(--accent) 55%, var(--line));
    }
  }
}

.springy :deep(li) {
  /* styles/spring.css, reproduced as scoped custom properties —
   * which is itself the demo: the whole preset is variables, so a
   * subtree opt-in is just this. */
  --dv-ease: linear(
    0,
    0.32 5.8%,
    0.674 11.6%,
    0.892 16.5%,
    1.047 22%,
    1.116 27.6%,
    1.118 32.4%,
    1.077 38.8%,
    1.01 49.5%,
    0.985 57.5%,
    0.993 66.9%,
    1.001 80.4%,
    1
  );
}

.days {
  display: flex;
  gap: 24px;
}

.day {
  /* An eyebrow, not a heading: uppercase at 11px with wide
   * tracking marks a column label without stealing weight from
   * the rows it labels. */
  margin: 0 0 8px;
  color: var(--ink-2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stops {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    padding: 9px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--card);
    transition: border-color 160ms cubic-bezier(0.2, 0, 0, 1);

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

.name {
  letter-spacing: 0.01em;
}

.time {
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.hint {
  margin: 0 0 12px;
  color: var(--ink-2);
  font-weight: 400;

  & kbd {
    padding: 1px 6px;
    border: 1px solid var(--line);
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--card);
    font: inherit;
  }

  & code {
    font:
      400 12px ui-monospace,
      monospace;
  }
}
</style>
