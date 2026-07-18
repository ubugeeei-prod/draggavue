# draggavue

Lightweight, type-safe, and fully accessible drag & drop primitives for Vue.js.

- **Tiny** — the whole library is **6.2 kB gzip**; `useDraggable` alone tree-shakes to **3.4 kB**. Zero dependencies.
- **Fast** — `transform`-only rendering, one state update per frame, geometry measured once per session, no idle listeners.
- **Type safe** — strict TypeScript everywhere, branded pixel units, generic components whose slots know your item type.
- **Accessible by default** — WAI-ARIA attributes, full keyboard grammar, live-region announcements. Localizable, tunable, or opt-out.
- **Headless** — composables first, unstyled components on top, opt-in stylesheets when you want the nice defaults.

## Install

```sh
vp install draggavue   # or: pnpm add draggavue
```

## Drag in three lines

```vue
<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useDraggable } from "draggavue";

const box = useTemplateRef<HTMLElement>("box");
const drag = useDraggable(box);
</script>

<template>
  <div ref="box" v-bind="drag.attrs.value" :style="drag.style.value">Drag me</div>
</template>
```

Pointer dragging, keyboard dragging (Space → arrows → Space, Escape cancels), and screen-reader announcements are all already on.

## Pick your layer

Everything is public, from renderless components down to the pure math:

| Layer        | Exports                                            | Use it when                     |
| ------------ | -------------------------------------------------- | ------------------------------- |
| Components   | `Draggable`, `SortableList`                        | you want markup wired for you   |
| Composables  | `useDraggable`, `useSortable`                      | you own the markup              |
| A11y toolkit | `DEFAULT_MESSAGES`, `intentFromKey`, `announce`, … | you localize or extend behavior |
| Pure core    | `press`, `movePointer`, `reorder`, `snapToGrid`, … | you build your own abstraction  |

```vue
<script setup lang="ts">
import { ref } from "vue";
import { SortableList } from "draggavue";

type Track = { id: number; title: string };

const tracks = ref<readonly Track[]>([
  { id: 1, title: "Overture" },
  { id: 2, title: "Interlude" },
]);

const trackKey = (track: Track): number => track.id;
</script>

<template>
  <SortableList :items="tracks" :item-key="trackKey" @update:items="(next) => (tracks = next)">
    <template #item="{ item, index }">{{ index + 1 }}. {{ item.title }}</template>
  </SortableList>
</template>
```

## Optional stylesheets

Two tiny, zero-specificity layers — cursors + focus ring, and a lift with a `linear()` spring settle:

```ts
import "draggavue/styles.css"; // or styles/core.css, styles/lift.css individually
```

Every knob is a CSS custom property (`--dv-lift-scale`, `--dv-ease-spring`, …) and `prefers-reduced-motion` is respected throughout.

## Where the docs live

**In your editor.** Every export ships reference-grade TSDoc — semantics, defaults, and runnable examples. Hover `useDraggable` and read on; there is deliberately no separate docs site to fall out of date.

Interactive references:

```sh
vp run musea   # component gallery (stories, props, a11y report)
vp run dev     # playground app
```

## Development

```sh
vp install
vp run ready            # fmt → lint → typecheck → tests → build
vp run test:browser     # Vitest Browser Mode (Chromium)
vp run size             # bundle-size report with hard budgets
vp run release minor    # tag-driven release → OIDC trusted publishing
```

## License

[MIT](./LICENSE)
