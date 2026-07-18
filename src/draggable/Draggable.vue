<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from "vue";
import type { KeyboardSteps } from "../a11y/keyboard";
import type { DragA11yMessages } from "../a11y/messages";
import type { Axis, Grid, Position } from "../shared/geometry";
import { ORIGIN } from "../shared/geometry";
import type { BoundsOption } from "./constraints";
import type { DragState, Dragging } from "./drag";
import { useDraggable } from "./useDraggable";

// Not destructured on purpose: destructured props compile to an
// empty render under Vize's Vapor mode today. Revert to the style
// guide's destructure once ubugeeei-prod/vize#3072 ships. Defaults
// live in the composable, which treats undefined as "use default".
const props = defineProps<{
  /** Rendered root element. */
  tag?: string;
  /** Controlled position. Pair with `@update:position`. */
  position?: Position;
  /** Starting position for uncontrolled usage. */
  initialPosition?: Position;
  axis?: Axis;
  grid?: Grid | null;
  bounds?: BoundsOption | null;
  disabled?: boolean;
  activationDistance?: number;
  keyboard?: boolean | Partial<KeyboardSteps>;
  a11y?: Partial<DragA11yMessages> | false;
}>();

const emit = defineEmits<{
  "drag:start": [session: Dragging];
  "drag:move": [session: Dragging];
  "drag:end": [position: Position];
  "drag:cancel": [position: Position];
  "update:position": [position: Position];
}>();

defineSlots<{
  default?: (props: { isDragging: boolean; position: Position; state: DragState }) => unknown;
}>();

const root = useTemplateRef<HTMLElement>("root");

// Bridges the controlled/uncontrolled prop pair into the single
// position ref the composable owns. No watchers: writes emit, reads
// prefer the prop when the parent controls it.
const fallback = shallowRef<Position>(props.position ?? props.initialPosition ?? ORIGIN);
const positionModel = computed<Position>({
  get: () => props.position ?? fallback.value,
  set: (next) => {
    fallback.value = next;
    emit("update:position", next);
  },
});

const drag = useDraggable(root, {
  position: positionModel,
  initialPosition: props.position ?? props.initialPosition ?? ORIGIN,
  axis: () => props.axis,
  grid: () => props.grid,
  bounds: () => props.bounds,
  disabled: () => props.disabled,
  activationDistance: () => props.activationDistance,
  keyboard: props.keyboard,
  a11y: props.a11y,
  onDragStart: (session) => emit("drag:start", session),
  onDragMove: (session) => emit("drag:move", session),
  onDragEnd: (settled) => emit("drag:end", settled),
  onDragCancel: (settled) => emit("drag:cancel", settled),
});

const livePosition = drag.position;
const state = drag.state;
const isDragging = drag.isDragging;
const style = drag.style;
const attrs = drag.attrs;

// Template avoids `props.*` too — Vapor compiles those references
// to a `_ctx.props` that does not exist (same tracking issue).
const rootTag = computed(() => props.tag ?? "div");

defineExpose({
  /** Root DOM element. */
  element: root,
  setPosition: drag.setPosition,
  reset: drag.reset,
  cancel: drag.cancel,
});
</script>

<template>
  <component :is="rootTag" ref="root" v-bind="attrs" :style="style">
    <slot :is-dragging="isDragging" :position="livePosition" :state="state" />
  </component>
</template>
