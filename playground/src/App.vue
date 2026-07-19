<script setup lang="ts">
import ConstraintsDemo from "./demos/ConstraintsDemo.vue";
import DraggableComponentDemo from "./demos/DraggableComponentDemo.vue";
import FreeDragDemo from "./demos/FreeDragDemo.vue";
import SortableDemo from "./demos/SortableDemo.vue";
</script>

<template>
  <header>
    <h1>draggavue</h1>
    <p>Drag &amp; drop primitives for Vue — light, typed, accessible.</p>
  </header>
  <main>
    <FreeDragDemo />
    <ConstraintsDemo />
    <DraggableComponentDemo />
    <SortableDemo />
  </main>
</template>

<style>
:root {
  /*
   * Ink on paper. ink carries a whisper of blue-violet (hue 272):
   * pure gray is dead on screens, and the cool cast stays neutral
   * next to any brand. paper sits just under white so cards have
   * somewhere brighter to go. accent shares the hue family — the
   * same light, brighter — and appears only while the system is
   * responding to your hand.
   */
  --ink: oklch(0.28 0.022 272);
  --ink-2: oklch(0.51 0.02 272);
  --line: oklch(0.9 0.008 272);
  --line-hover: oklch(0.82 0.012 272);
  --paper: oklch(0.985 0.002 272);
  --card: oklch(1 0 0);
  --accent: oklch(0.54 0.19 265);

  /* The demos' shared response curve — fast out of the gate,
   * soft into the stop (see lift.css for the reasoning). */
  --ease: cubic-bezier(0.2, 0, 0, 1);

  color-scheme: light dark;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* The same relationships, inverted: ink and paper swap L
     * bands, lines sink instead of rise, the accent gains a step
     * of lightness to hold contrast on dark ground. */
    --ink: oklch(0.9 0.012 272);
    --ink-2: oklch(0.66 0.015 272);
    --line: oklch(0.32 0.012 272);
    --line-hover: oklch(0.42 0.015 272);
    --paper: oklch(0.19 0.012 272);
    --card: oklch(0.24 0.014 272);
    --accent: oklch(0.68 0.16 265);
  }
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
}
</style>

<style scoped>
header {
  max-width: 720px;
  margin: 0 auto;
  padding: 56px 24px 0;

  & h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 650;

    /* Display-size text wants its letterforms a touch closer than
     * the browser default — tightening here, and only here, gives
     * the wordmark its own voice without a webfont. */
    letter-spacing: -0.02em;
  }

  & p {
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: 14px;
  }
}

main {
  display: grid;

  /* 56px between sections: each demo is a chapter, and chapter
   * breaks must be unmistakably larger than any spacing inside a
   * demo (max 24px there). */
  gap: 56px;
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px 96px;
}
</style>
