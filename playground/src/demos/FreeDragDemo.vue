<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useDraggable } from "draggavue";

const card = useTemplateRef<HTMLElement>("card");
const drag = useDraggable(card);
</script>

<template>
  <section>
    <h2>Free drag — <code>useDraggable</code></h2>
    <p>
      Drag the card with a pointer, or focus it and press
      <kbd>Space</kbd> then the arrow keys (<kbd>Shift</kbd> for 1px steps, <kbd>Esc</kbd> cancels).
    </p>
    <div class="stage">
      <article ref="card" class="card" v-bind="drag.attrs.value" :style="drag.style.value">
        <strong>Drag me</strong>
        <output
          >{{ Math.round(drag.position.value.x) }}, {{ Math.round(drag.position.value.y) }}</output
        >
      </article>
    </div>
    <button type="button" @click="drag.reset()">Reset position</button>
  </section>
</template>

<style scoped>
.stage {
  height: 12rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.card {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-primary-soft);
  cursor: grab;

  &[data-dragging="true"] {
    cursor: grabbing;
    box-shadow: var(--shadow-lift);
  }

  & output {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
  }
}

button {
  margin-top: 0.75rem;
}
</style>
