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

const chip = useTemplateRef<HTMLElement>("chip");
const drag = useDraggable(chip, {
  axis,
  grid: () => (snap.value ? GRID : null),
  bounds: () => (contained.value ? "parent" : null),
  activationDistance,
});
</script>

<template>
  <section>
    <h2>Constraints — axis, grid, bounds</h2>
    <p>Every option is reactive; the next drag picks up whatever is set here.</p>
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
      <label><input v-model="contained" type="checkbox" /> Keep inside the stage</label>
      <label>
        Activation
        <input v-model.number="activationDistance" type="range" min="0" max="24" />
        <output>{{ activationDistance }}px</output>
      </label>
    </fieldset>
    <div class="desk" :class="{ dotted: snap }">
      <div ref="chip" class="track" v-bind="drag.attrs.value" :style="drag.style.value">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Constrained</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
section > h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 650;
}

section > p {
  margin: 0 0 16px;
  color: var(--ink-2);
  font-size: 13px;
  line-height: 1.6;
}

fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  align-items: center;
  margin: 0 0 12px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 13px;

  & legend {
    /* An eyebrow, not a heading: small caps-style label for a
     * control cluster, quiet enough to leave focus on the stage. */
    padding: 0 6px;
    color: var(--ink-2);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  & label {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }

  & output {
    min-width: 34px;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
}

.desk {
  height: 192px;
  overflow: hidden;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;

  /* The grid appears only while snapping is on, at the exact 24px
   * pitch of the constraint — the stage tells the truth about the
   * physics currently in force. */
  &.dotted {
    background-image: radial-gradient(circle, var(--line) 1px, transparent 1px);
    background-size: 24px 24px;
  }
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
</style>
