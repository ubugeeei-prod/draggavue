<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from "vue";
import type { KeyboardSteps } from "../a11y/keyboard";
import type { DragA11yMessages } from "../a11y/messages";
import type { Axis, Grid, Position } from "../shared/geometry";
import { ORIGIN } from "../shared/geometry";
import type { BoundsOption } from "./constraints";
import type { DragState, Dragging } from "./drag";
import { useDraggable } from "./useDraggable";

const {
  tag = "div",
  position = undefined,
  initialPosition = undefined,
  axis = "both",
  grid = null,
  bounds = null,
  disabled = false,
  activationDistance = 0,
  keyboard = true,
  a11y = undefined,
} = defineProps<{
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
const fallback = shallowRef<Position>(position ?? initialPosition ?? ORIGIN);
const positionModel = computed<Position>({
  get: () => position ?? fallback.value,
  set: (next) => {
    fallback.value = next;
    emit("update:position", next);
  },
});

const drag = useDraggable(root, {
  position: positionModel,
  axis: () => axis,
  grid: () => grid,
  bounds: () => bounds,
  disabled: () => disabled,
  activationDistance: () => activationDistance,
  keyboard,
  a11y,
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

defineExpose({
  /** Root DOM element. */
  element: root,
  setPosition: drag.setPosition,
  reset: drag.reset,
  cancel: drag.cancel,
});
</script>

<template>
  <component :is="tag" ref="root" v-bind="attrs" :style="style">
    <slot :is-dragging="isDragging" :position="livePosition" :state="state" />
  </component>
</template>
