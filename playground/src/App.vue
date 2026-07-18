<script setup lang="ts">
import ConstraintsDemo from "./demos/ConstraintsDemo.vue";
import DraggableComponentDemo from "./demos/DraggableComponentDemo.vue";
import FreeDragDemo from "./demos/FreeDragDemo.vue";
import SortableDemo from "./demos/SortableDemo.vue";
</script>

<template>
  <header>
    <h1>draggavue</h1>
    <p>Lightweight, type-safe, accessible drag &amp; drop primitives for Vue.js</p>
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
  --color-bg: #f6f7f9;
  --color-surface: #ffffff;
  --color-border: #d8dde3;
  --color-primary: #3e63dd;
  --color-primary-soft: #e6ebfe;
  --color-text: #1c2024;
  --color-text-muted: #667085;
  --radius-card: 12px;
  --radius-control: 8px;
  --shadow-lift: 0 8px 24px rgb(28 32 36 / 0.16);

  color-scheme: light;
  font-family: "Avenir Next", "Segoe UI", system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #101215;
    --color-surface: #1a1d21;
    --color-border: #2e3338;
    --color-primary: #6e8bff;
    --color-primary-soft: #253052;
    --color-text: #e6e9ec;
    --color-text-muted: #9aa4b2;
    --shadow-lift: 0 8px 24px rgb(0 0 0 / 0.5);

    color-scheme: dark;
  }
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
}
</style>

<style scoped>
header {
  padding: 2.5rem 2rem 0;

  & h1 {
    margin: 0;
    font-size: 2rem;
    letter-spacing: -0.02em;
  }

  & p {
    margin: 0.25rem 0 0;
    color: var(--color-text-muted);
  }
}

main {
  display: grid;
  gap: 2rem;
  max-width: 60rem;
  padding: 2rem;
}
</style>
