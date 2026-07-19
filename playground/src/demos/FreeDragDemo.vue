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
      Drag the card anywhere. Or focus it and press <kbd>Space</kbd>, steer with the arrow keys
      (<kbd>Shift</kbd> for 1px), drop with <kbd>Space</kbd> — <kbd>Esc</kbd> springs it home.
    </p>
    <div class="desk">
      <article ref="card" class="track" v-bind="drag.attrs.value" :style="drag.style.value">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Overture</span>
        <output class="time">
          {{ Math.round(drag.position.value.x) }}, {{ Math.round(drag.position.value.y) }}
        </output>
      </article>
    </div>
    <button type="button" @click="drag.reset()">Reset position</button>
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
  /* Dashed: limits, not walls — the free card may leave, the
   * bounded variants may not. Keeping the same stage everywhere
   * makes the difference legible. */
  height: 192px;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
}

.track {
  display: inline-grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  font-size: 13px;
  font-weight: 500;
  transition: border-color 160ms var(--ease);

  /* Hover answers only at the boundary — nothing may move under an
   * approaching pointer. The lift itself comes from lift.css. */
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

.time {
  color: var(--ink-2);

  /* Live coordinates change every frame — tabular digits keep the
   * card's width from trembling while it moves. */
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

button {
  margin-top: 12px;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
  font: 500 13px/1 inherit;
  cursor: pointer;
  transition: border-color 160ms var(--ease);

  &:hover {
    border-color: var(--line-hover);
  }
}
</style>
