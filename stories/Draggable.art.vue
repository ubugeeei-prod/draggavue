<script setup lang="ts">
import type { Grid } from "../src/index";
import { px } from "../src/index";
import "../src/styles/index.css";

defineArt("../src/draggable/Draggable.vue", {
  title: "Draggable",
  category: "Components",
  tags: ["drag", "headless", "a11y"],
});

const GRID: Grid = [px(24), px(24)];
</script>

<art>
  <variant name="Basic" default>
    <Draggable class="card">Drag me — pointer or Space + arrows</Draggable>
  </variant>

  <variant name="Inside parent bounds">
    <div class="stage">
      <Draggable class="card" bounds="parent">Bounded</Draggable>
    </div>
  </variant>

  <variant name="X axis only">
    <Draggable class="card" axis="x">Slides horizontally</Draggable>
  </variant>

  <variant name="Snap to a 24px grid">
    <Draggable class="card" :grid="GRID">Snaps in 24px steps</Draggable>
  </variant>

  <variant name="Activation distance">
    <Draggable class="card" :activation-distance="12">
      Needs 12px of travel before it moves
    </Draggable>
  </variant>
</art>

<style scoped>
.art-preview {
  padding: 1rem;
}

.stage {
  height: 10rem;
  overflow: hidden;
  border: 1px dashed #c9cfd6;
  border-radius: 12px;
}

.card {
  display: inline-block;
  padding: 0.75rem 1.25rem;
  border: 1px solid #c9cfd6;
  border-radius: 12px;
  background: #eef1ff;
}
</style>
