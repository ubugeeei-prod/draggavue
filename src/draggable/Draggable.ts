import type { KeyboardSteps } from "../a11y/keyboard";
import type { DragA11yMessages } from "../a11y/messages";
import type { Axis, Grid, Position } from "../shared/geometry";
import type { BoundsOption } from "./constraints";
import type { DragState, Dragging } from "./drag";
import DraggableImpl from "./Draggable.vue";

// --- Types & Signatures ---

export interface DraggableProps {
  /** Rendered root element. @default "div" */
  tag?: string;
  /** Controlled position. Pair with `@update:position`. */
  position?: Position;
  /** Starting position for uncontrolled usage. @default ORIGIN */
  initialPosition?: Position;
  /** @default "both" */
  axis?: Axis;
  /** @default null */
  grid?: Grid | null;
  /** @default null */
  bounds?: BoundsOption | null;
  /** @default false */
  disabled?: boolean;
  /** @default 0 */
  activationDistance?: number;
  /** @default true */
  keyboard?: boolean | Partial<KeyboardSteps>;
  a11y?: Partial<DragA11yMessages> | false;
  "onDrag:start"?: (session: Dragging) => void;
  "onDrag:move"?: (session: Dragging) => void;
  "onDrag:end"?: (position: Position) => void;
  "onDrag:cancel"?: (position: Position) => void;
  "onUpdate:position"?: (position: Position) => void;
}

export interface DraggableSlotProps {
  isDragging: boolean;
  position: Position;
  state: DragState;
}

/** Instance surface reachable through a template ref. */
export interface DraggableExposed {
  readonly element: HTMLElement | null;
  setPosition(next: Position): void;
  reset(): void;
  cancel(): void;
}

/**
 * Hand-written public contract for the SFC implementation.
 *
 * Vize cannot emit SFC declaration files yet, so this constructor
 * interface mirrors exactly what `<script setup>` declares. The
 * shape is verified against the implementation by `vize check` in
 * every pipeline run.
 */
export interface DraggableComponent {
  new (props: DraggableProps): {
    $props: DraggableProps;
    $slots: { default?: (props: DraggableSlotProps) => unknown };
  } & DraggableExposed;
}

// --- Implementation ---

/**
 * Headless draggable component — {@link useDraggable} without
 * writing a composable call.
 *
 * Renders a single root element (`tag`, default `div`) with the
 * transform, ARIA attributes, and keyboard handling already bound.
 * Everything visual stays yours: style the element, use the
 * `data-dragging` attribute for drag-state looks, and read the slot
 * props for richer rendering.
 *
 * Two ownership modes:
 *
 * - **Uncontrolled** — pass `initial-position` (or nothing) and the
 *   component keeps its own position.
 * - **Controlled** — pass `position` and update it from
 *   `@update:position`; the parent owns the state and may reject or
 *   transform moves.
 *
 * @example Uncontrolled, with drag-state styling
 * ```vue
 * <Draggable v-slot="{ isDragging }" class="card" bounds="parent">
 *   {{ isDragging ? "…" : "Drag me" }}
 * </Draggable>
 *
 * <style scoped>
 * .card[data-dragging="true"] {
 *   box-shadow: var(--shadow-lift);
 * }
 * </style>
 * ```
 *
 * @example Controlled
 * ```vue
 * <script setup lang="ts">
 * import { shallowRef } from "vue";
 * import { Draggable, ORIGIN, type Position } from "draggavue";
 *
 * const position = shallowRef<Position>(ORIGIN);
 * </script>
 *
 * <template>
 *   <Draggable
 *     :position="position"
 *     @update:position="(next) => (position = next)"
 *   />
 * </template>
 * ```
 *
 * @see {@link useDraggable} when you need handles, controlled refs,
 * or custom roots.
 */
export const Draggable: DraggableComponent = DraggableImpl as unknown as DraggableComponent;
