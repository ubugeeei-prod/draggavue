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
    <p class="hint">Drag anywhere. Or focus it — <kbd>Space</kbd>, arrows, <kbd>Space</kbd>.</p>
    <Draggable class="track">
      <span class="grip" aria-hidden="true"></span>
      <span class="name">Overture</span>
      <span class="time">3:12</span>
    </Draggable>
  </variant>

  <variant name="Multiple draggables">
    <p class="hint">Each card is its own session — try two fingers on touch.</p>
    <div class="loose">
      <Draggable class="track">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Overture</span>
        <span class="time">3:12</span>
      </Draggable>
      <Draggable class="track">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Interlude</span>
        <span class="time">1:47</span>
      </Draggable>
      <Draggable class="track">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Finale</span>
        <span class="time">5:21</span>
      </Draggable>
    </div>
  </variant>

  <variant name="Spring settle">
    <p class="hint">Throw it somewhere, then press <kbd>Esc</kbd> — it springs home.</p>
    <Draggable class="track">
      <span class="grip" aria-hidden="true"></span>
      <span class="name">Crescendo</span>
      <span class="time">4:05</span>
    </Draggable>
  </variant>

  <variant name="Inside parent bounds">
    <div class="desk">
      <Draggable class="track" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Bounded</span>
        <span class="time">0:58</span>
      </Draggable>
    </div>
  </variant>

  <variant name="X axis only">
    <div class="rail">
      <Draggable class="track" axis="x" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Slides on x</span>
      </Draggable>
    </div>
  </variant>

  <variant name="Snap to a 24px grid">
    <div class="desk dotted">
      <Draggable class="track" :grid="GRID" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Snaps</span>
      </Draggable>
    </div>
  </variant>

  <variant name="Activation distance">
    <p class="hint">Needs 12px of travel first — clicks inside stay clicks.</p>
    <Draggable class="track" :activation-distance="12">
      <span class="grip" aria-hidden="true"></span>
      <span class="name">Deliberate</span>
      <span class="time">2:33</span>
    </Draggable>
  </variant>
</art>

<style scoped>
.musea-variant {
  /*
   * Ink on paper. Every value hangs off two decisions:
   *
   * ink is a near-black with a whisper of blue-violet (hue 272) —
   * pure gray reads as dead on screens, and the cool cast keeps
   * the demo neutral next to any brand color. paper sits at
   * L 0.985, not white: the cards need somewhere brighter to go.
   *
   * accent shares the ink's hue family (265) so it reads as "the
   * same light, brighter" — it appears only when the system is
   * responding to your hand.
   */
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

  /* System stack: the demo shows the library inside *your* app,
   * so it must not bring a voice of its own. 13px — tool-sized
   * text, one step below prose. */
  font:
    500 13px/1.5 ui-sans-serif,
    system-ui,
    sans-serif;
}

.track {
  /* inline-grid: the card hugs its content — a draggable should
   * look holdable, and full-width slabs don't. Columns: grip,
   * name (flexible), time. */
  display: inline-grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  min-width: 200px;
  padding: 10px 14px;

  /* The border is the boundary of what your hand owns: 1px of
   * function, not decoration. It is also the only hover response —
   * anything that *moves* on hover makes the target feel like it's
   * escaping the grab. */
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  transition: border-color 160ms cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    border-color: var(--line-hover);
  }

  /* While held, the boundary lights up in the accent: "this is in
   * your hand now". The shadow and scale come from lift.css. */
  &[data-dragging="true"] {
    border-color: color-mix(in oklab, var(--accent) 55%, var(--line));
  }
}

.grip {
  /* Six dots — the drag glyph screen readers skip and every hand
   * recognizes. Drawn with dotted borders so it inherits currentColor
   * and needs no asset. */
  width: 3px;
  height: 14px;
  border-inline: 2px dotted var(--ink-2);
  opacity: 0.65;
}

.name {
  letter-spacing: 0.01em;
}

.time {
  color: var(--ink-2);

  /* Coordinates and durations change while things move — tabular
   * digits keep the card's width from trembling. */
  font-variant-numeric: tabular-nums;
}

.loose {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.desk {
  /* A bounded stage is drawn dashed: the convention for "limits,
   * not walls" — content may touch it, nothing may pass it. */
  height: 176px;
  overflow: hidden;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
}

.rail {
  /* One-axis variant gets a one-axis stage: a strip as tall as the
   * card plus breathing room, so the constraint is visible before
   * the first drag. */
  overflow: hidden;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
}

.dotted {
  /* The grid the card snaps to, shown honestly: dots at the exact
   * 24px pitch of the constraint, faint enough to be furniture. */
  background-image: radial-gradient(circle, var(--line) 1px, transparent 1px);
  background-size: 24px 24px;
}

.hint {
  margin: 0 0 12px;
  color: var(--ink-2);
  font-weight: 400;

  & kbd {
    padding: 1px 6px;
    border: 1px solid var(--line);

    /* The thicker bottom edge is the entire keycap metaphor —
     * one border-width instead of a gradient. */
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--card);
    font: inherit;
  }
}
</style>
