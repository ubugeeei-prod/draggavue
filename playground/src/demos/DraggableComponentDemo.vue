<script setup lang="ts">
import { shallowRef } from "vue";
import type { Position } from "draggavue";
import { Draggable, ORIGIN } from "draggavue";

const position = shallowRef<Position>(ORIGIN);
</script>

<template>
  <section>
    <h2>Component — <code>&lt;Draggable&gt;</code></h2>
    <p>Controlled mode: the parent owns the position and receives every update.</p>
    <div class="desk">
      <Draggable
        v-slot="{ isDragging }"
        class="track"
        :position="position"
        bounds="parent"
        @update:position="(next) => (position = next)"
      >
        <span class="grip" aria-hidden="true"></span>
        <span class="name">{{ isDragging ? "In your hand" : "Controlled" }}</span>
      </Draggable>
    </div>
    <output class="readout">
      Parent sees {{ Math.round(position.x) }}, {{ Math.round(position.y) }}
    </output>
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

.desk {
  height: 160px;
  overflow: hidden;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
}

.track {
  display: inline-grid;
  grid-template-columns: auto auto;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
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

.grip {
  width: 3px;
  height: 14px;
  border-inline: 2px dotted var(--ink-2);
  opacity: 0.65;
}

.readout {
  /* The proof of controlled mode is the parent's copy of the
   * position — shown in the data voice: small, muted, tabular. */
  display: block;
  margin-top: 12px;
  color: var(--ink-2);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
</style>
