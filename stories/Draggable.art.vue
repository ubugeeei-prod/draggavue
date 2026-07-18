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
    <Draggable class="card">
      <span class="grip" aria-hidden="true"></span>
      Drag me — pointer, or Space + arrows
    </Draggable>
  </variant>

  <variant name="Multiple draggables">
    <div class="row">
      <Draggable class="card tone-a">
        <span class="grip" aria-hidden="true"></span>
        One
      </Draggable>
      <Draggable class="card tone-b">
        <span class="grip" aria-hidden="true"></span>
        Two
      </Draggable>
      <Draggable class="card tone-c">
        <span class="grip" aria-hidden="true"></span>
        Three
      </Draggable>
    </div>
  </variant>

  <variant name="Spring settle">
    <p class="hint">Drag anywhere, then press <kbd>Esc</kbd> — it springs home.</p>
    <Draggable class="card">
      <span class="grip" aria-hidden="true"></span>
      Throw me, cancel me
    </Draggable>
  </variant>

  <variant name="Inside parent bounds">
    <div class="stage">
      <Draggable class="card" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        Bounded
      </Draggable>
    </div>
  </variant>

  <variant name="X axis only">
    <Draggable class="card" axis="x">
      <span class="grip" aria-hidden="true"></span>
      Slides horizontally
    </Draggable>
  </variant>

  <variant name="Snap to a 24px grid">
    <div class="stage dotted">
      <Draggable class="card" :grid="GRID" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        Snaps in steps
      </Draggable>
    </div>
  </variant>

  <variant name="Activation distance">
    <Draggable class="card" :activation-distance="12">
      <span class="grip" aria-hidden="true"></span>
      Needs 12px of intent
    </Draggable>
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

.card {
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.7rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--paper);
  letter-spacing: 0.01em;

  &[data-dragging="true"] {
    border-color: color-mix(in oklab, var(--accent) 45%, var(--line));
  }
}

.grip {
  width: 4px;
  height: 16px;
  border-inline: 2px dotted var(--ink-soft);
  opacity: 0.7;
}

.row {
  display: flex;
  gap: 0.9rem;
}

.tone-a {
  background: color-mix(in oklab, var(--accent) 7%, var(--paper));
}

.tone-b {
  background: color-mix(in oklab, oklch(0.7 0.14 160) 9%, var(--paper));
}

.tone-c {
  background: color-mix(in oklab, oklch(0.75 0.13 60) 10%, var(--paper));
}

.stage {
  height: 11rem;
  overflow: hidden;
  border: 1px dashed var(--line);
  border-radius: 16px;
  background: color-mix(in oklab, var(--paper) 60%, oklch(0.97 0.005 265));
}

.stage .card {
  margin: 0.75rem;
}

.dotted {
  background-image: radial-gradient(circle, var(--line) 1px, transparent 1px);
  background-size: 24px 24px;
}

.hint {
  margin: 0 0 0.75rem;
  color: var(--ink-soft);
  font-weight: 400;

  & kbd {
    padding: 0.1em 0.45em;
    border: 1px solid var(--line);
    border-bottom-width: 2px;
    border-radius: 6px;
    background: var(--paper);
    font: inherit;
  }
}
</style>
