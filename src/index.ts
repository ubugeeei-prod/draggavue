/**
 * draggavue — lightweight, type-safe, accessible drag & drop
 * primitives for Vue.js.
 *
 * The library is layered, and every layer is public:
 *
 * - **Composables** — {@link useDraggable} for free dragging,
 *   {@link useSortable} for list reordering. Headless, reactive,
 *   accessible by default.
 * - **Components** — {@link Draggable} and {@link SortableList},
 *   thin fully-typed wrappers over the composables for the common
 *   cases.
 * - **Pure core** — the geometry toolkit ({@link translate},
 *   {@link snapToGrid}, …), the drag state machine ({@link press},
 *   {@link movePointer}, …), and the reorder math
 *   ({@link reorder}, {@link targetIndexOf}, …). Framework-free and
 *   fully unit-tested; build your own abstractions on top of the
 *   same primitives the composables use.
 * - **A11y toolkit** — message catalogs ({@link DEFAULT_MESSAGES},
 *   {@link DEFAULT_SORT_MESSAGES}), the keyboard grammar
 *   ({@link intentFromKey}), and the shared live region
 *   ({@link announce}).
 *
 * Everything is documented where it is declared — hover any export
 * for its specification, defaults, and examples.
 *
 * @example Install and drag in three lines
 * ```vue
 * <script setup lang="ts">
 * import { useTemplateRef } from "vue";
 * import { useDraggable } from "draggavue";
 *
 * const box = useTemplateRef<HTMLElement>("box");
 * const drag = useDraggable(box);
 * </script>
 *
 * <template>
 *   <div ref="box" v-bind="drag.attrs.value" :style="drag.style.value" />
 * </template>
 * ```
 *
 * @packageDocumentation
 */

export { announce } from "./a11y/announcer";
export type { DragIntent, KeyboardSteps } from "./a11y/keyboard";
export { DEFAULT_STEPS, intentFromKey } from "./a11y/keyboard";
export type { DragA11yMessages, SortA11yMessages } from "./a11y/messages";
export { DEFAULT_MESSAGES, DEFAULT_SORT_MESSAGES, describePosition } from "./a11y/messages";
export type { BoundsOption, ConstraintOptions } from "./draggable/constraints";
export type {
  DragBounds,
  DragConstraints,
  DragSource,
  DragState,
  DragTransition,
  Dragging,
  Idle,
  KeyboardDragging,
  Pending,
  PointerDragging,
} from "./draggable/drag";
export {
  IDLE,
  cancel,
  commit,
  grab,
  moveBy,
  movePointer,
  press,
  release,
  resolveDelta,
} from "./draggable/drag";
export type {
  DraggableComponent,
  DraggableExposed,
  DraggableProps,
  DraggableSlotProps,
} from "./draggable/Draggable";
export { Draggable } from "./draggable/Draggable";
export type { DragA11yOptions, DraggableAttrs } from "./draggable/dragA11y";
export type {
  DraggableCallbacks,
  DraggableStyle,
  UseDraggableOptions,
  UseDraggableReturn,
} from "./draggable/useDraggable";
export { useDraggable } from "./draggable/useDraggable";
export type { DraggableElement, ElementTarget } from "./shared/dom";
export type { Orientation, SortableLayout } from "./sortable/sortable";
export {
  indexStepOf,
  layoutFromRects,
  mainAxisOffset,
  reorder,
  shiftFor,
  targetIndexOf,
} from "./sortable/sortable";
export type {
  SortableListComponent,
  SortableListExposed,
  SortableListItemSlotProps,
  SortableListProps,
} from "./sortable/SortableList";
export { SortableList } from "./sortable/SortableList";
export type {
  SortableItemA11y,
  SortableItemAttrs,
  SortableItemStyle,
} from "./sortable/sortableItemView";
export { sortableItemAttrs, sortableItemStyle } from "./sortable/sortableItemView";
export type {
  ActiveSort,
  SortEvent,
  UseSortableOptions,
  UseSortableReturn,
} from "./sortable/useSortable";
export { useSortable } from "./sortable/useSortable";
export type { Axis, Delta, Grid, Position, Rect, Size } from "./shared/geometry";
export {
  ORIGIN,
  ZERO_DELTA,
  clampToRect,
  constrainToAxis,
  deltaBetween,
  magnitude,
  snapToGrid,
  translate,
} from "./shared/geometry";
export type { Px } from "./shared/units";
export { px } from "./shared/units";
