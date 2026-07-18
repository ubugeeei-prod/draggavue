<script setup lang="ts">
import type { Ref } from "vue";
import { ref, useTemplateRef } from "vue";
import type { Axis, Grid } from "draggavue";
import { px, useDraggable } from "draggavue";

const axis: Ref<Axis> = ref("both");
const snap = ref(false);
const contained = ref(true);
const activationDistance = ref(0);

const GRID: Grid = [px(24), px(24)];

const box = useTemplateRef<HTMLElement>("box");
const drag = useDraggable(box, {
  axis,
  grid: () => (snap.value ? GRID : null),
  bounds: () => (contained.value ? "parent" : null),
  activationDistance,
});
</script>

<template>
  <section>
    <h2>Constraints — axis, grid, bounds</h2>
    <p>Every option is reactive; the next session picks up the current values.</p>
    <fieldset>
      <legend>Session constraints</legend>
      <label>
        Axis
        <select v-model="axis">
          <option value="both">both</option>
          <option value="x">x</option>
          <option value="y">y</option>
        </select>
      </label>
      <label><input v-model="snap" type="checkbox" /> Snap to 24px grid</label>
      <label><input v-model="contained" type="checkbox" /> Keep inside parent</label>
      <label>
        Activation distance
        <input v-model.number="activationDistance" type="range" min="0" max="24" />
        <output>{{ activationDistance }}px</output>
      </label>
    </fieldset>
    <div class="stage">
      <div ref="box" class="chip" v-bind="drag.attrs.value" :style="drag.style.value">⠿</div>
    </div>
  </section>
</template>

<style scoped>
fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);

  & label {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
  }
}

.stage {
  height: 12rem;
  margin-top: 0.75rem;
  overflow: hidden;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-card);
  background:
    repeating-linear-gradient(0deg, transparent 0 23px, var(--color-bg) 23px 24px),
    repeating-linear-gradient(90deg, transparent 0 23px, var(--color-bg) 23px 24px),
    var(--color-surface);
}

.chip {
  display: inline-grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  margin: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  font-size: 1.25rem;
  cursor: grab;

  &[data-dragging="true"] {
    cursor: grabbing;
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lift);
  }
}
</style>
