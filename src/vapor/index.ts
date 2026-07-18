/**
 * draggavue/vapor — the same components, compiled for Vue Vapor.
 *
 * Vapor mode (Vue 3.6+) renders without a virtual DOM. This entry
 * ships {@link Draggable} and {@link SortableList} compiled by
 * Vize's Vapor compiler; their public contracts (props, emits,
 * slots, exposed) are byte-for-byte the same types as the vdom
 * build, so switching entries never changes your code.
 *
 * The composables are renderer-agnostic — import them from
 * `"draggavue"` as usual; only components need the Vapor build:
 *
 * @example
 * ```ts
 * import { createVaporApp } from "vue";
 * import { useDraggable } from "draggavue";          // renderer-agnostic
 * import { Draggable, SortableList } from "draggavue/vapor";
 * ```
 *
 * Requires `vue@^3.6.0-rc`.
 *
 * @experimental Vapor itself is a Vue 3.6 release candidate, and
 * Vize's Vapor codegen cannot yet compile slot-bearing components
 * correctly — mounting these components crashes until
 * {@link https://github.com/ubugeeei-prod/vize/issues/3073 vize#3073}
 * (and {@link https://github.com/ubugeeei-prod/vize/issues/3072 vize#3072})
 * land. The build, the types, and this entry are stable; the
 * runtime lights up with a Vize release, tracked by `it.fails`
 * canaries in the test suite.
 *
 * @packageDocumentation
 */

export type {
  DraggableComponent,
  DraggableExposed,
  DraggableProps,
  DraggableSlotProps,
} from "../draggable/Draggable";
export { Draggable } from "../draggable/Draggable";
export type {
  SortableListComponent,
  SortableListExposed,
  SortableListItemSlotProps,
  SortableListProps,
} from "../sortable/SortableList";
export { SortableList } from "../sortable/SortableList";
