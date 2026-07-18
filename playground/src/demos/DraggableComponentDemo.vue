<script setup lang="ts">
import { shallowRef } from "vue";
import type { Position } from "draggavue";
import { Draggable, ORIGIN } from "draggavue";

const position = shallowRef<Position>(ORIGIN);
</script>

<template>
  <section>
    <h2>Component — <code>&lt;Draggable&gt;</code></h2>
    <p>Controlled mode: the parent owns the position and receives updates.</p>
    <div class="stage">
      <Draggable
        v-slot="{ isDragging }"
        class="token"
        :position="position"
        bounds="parent"
        @update:position="(next) => (position = next)"
      >
        {{ isDragging ? "…" : "✋" }}
      </Draggable>
    </div>
    <output> Parent sees: {{ Math.round(position.x) }}, {{ Math.round(position.y) }} </output>
  </section>
</template>

<style scoped>
.stage {
  height: 10rem;
  overflow: hidden;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.token {
  display: inline-grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-primary-soft);
  font-size: 1.5rem;
  cursor: grab;

  &[data-dragging="true"] {
    cursor: grabbing;
    box-shadow: var(--shadow-lift);
  }
}

output {
  display: block;
  margin-top: 0.5rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
