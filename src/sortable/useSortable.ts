import {
  computed,
  getCurrentScope,
  onMounted,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
} from "vue";
import { announce, ensureInstructionsElement } from "../a11y/announcer";
import { DEFAULT_STEPS, intentFromKey } from "../a11y/keyboard";
import type { SortA11yMessages } from "../a11y/messages";
import { DEFAULT_SORT_MESSAGES } from "../a11y/messages";
import type { DragConstraints, DragState, DragTransition } from "../draggable/drag";
import {
  IDLE,
  cancel as cancelDrag,
  commit,
  grab,
  moveBy,
  movePointer,
  press,
  release,
} from "../draggable/drag";
import type { ElementTarget } from "../shared/dom";
import {
  isElement,
  measureRect,
  pointFromEvent,
  restoreUserSelect,
  suppressUserSelect,
} from "../shared/dom";
import type { Delta } from "../shared/geometry";
import { ORIGIN } from "../shared/geometry";
import { createPointerSession } from "../shared/pointerSession";
import { px } from "../shared/units";
import type { SortableLayout } from "./sortable";
import { indexStepOf, layoutFromRects, mainAxisOffset, reorder, targetIndexOf } from "./sortable";
import { sortableItemAttrs, sortableItemStyle } from "./sortableItemView";
import type {
  ActiveSort,
  SortEvent,
  UseSortableOptions,
  UseSortableReturn,
} from "./useSortable.def";

export type {
  ActiveSort,
  SortEvent,
  UseSortableOptions,
  UseSortableReturn,
} from "./useSortable.def";

const REST_CONSTRAINTS: DragConstraints = {
  axis: "y",
  grid: null,
  bounds: null,
  activationDistance: px(0),
};

/**
 * Accessible list reordering on top of the drag state machine.
 *
 * Fully headless and controlled: you render the list with `v-for`,
 * bind {@link UseSortableReturn.itemAttrs} and
 * {@link UseSortableReturn.itemStyle} to each item, and apply the
 * reordered array when {@link UseSortableOptions.onReorder} hands
 * it to you. The composable never mutates your data.
 *
 * Interaction model:
 *
 * - **Pointer** — press an item and move along the main axis; the
 *   target slot follows the passed item centers, and neighbors
 *   shift out of the way with a transition.
 * - **Keyboard** — focus an item, grab with Space/Enter, step with
 *   the arrow keys (clamped at the edges), drop with Space/Enter,
 *   cancel with Escape. Every step is announced with 1-based
 *   positions.
 *
 * Performance notes: **one** delegated listener set on the
 * container drives any number of items (no per-item listeners),
 * geometry is captured once per session, and every per-frame
 * decision is pure arithmetic over that snapshot.
 *
 * @param container - The list container element; items are its
 * direct children carrying the attributes from `itemAttrs`.
 * @param options - Data source, reorder sink, constraints, a11y,
 * and lifecycle callbacks. See {@link UseSortableOptions}.
 * @returns The live session plus per-item binding helpers. See
 * {@link UseSortableReturn}.
 *
 * @example A minimal sortable list
 * ```vue
 * <script setup lang="ts">
 * import { ref, useTemplateRef } from "vue";
 * import { useSortable } from "draggavue";
 *
 * const items = ref(["Overture", "Interlude", "Finale"]);
 * const list = useTemplateRef<HTMLElement>("list");
 *
 * const sortable = useSortable(list, {
 *   items: () => items.value,
 *   onReorder: (next) => {
 *     items.value = [...next];
 *   },
 * });
 * </script>
 *
 * <template>
 *   <ul ref="list">
 *     <li
 *       v-for="(item, index) in items"
 *       :key="item"
 *       v-bind="sortable.itemAttrs(index)"
 *       :style="sortable.itemStyle(index)"
 *     >
 *       {{ item }}
 *     </li>
 *   </ul>
 * </template>
 * ```
 */
export function useSortable<T>(
  container: ElementTarget,
  options: UseSortableOptions<T>,
): UseSortableReturn {
  const messages: SortA11yMessages | null =
    options.a11y === false ? null : { ...DEFAULT_SORT_MESSAGES, ...options.a11y };
  const keyboardEnabled = options.keyboard !== false;
  const neighborTransition =
    // The var() falls back to plain ease, and upgrades itself when
    // the opt-in stylesheet (which defines --dv-ease) is loaded.
    options.transition === false
      ? null
      : (options.transition ?? "transform 180ms var(--dv-ease, ease)");

  const active = shallowRef<ActiveSort | null>(null);
  const isSorting = computed(() => active.value !== null);

  // Session internals — swapped wholesale, never observed by views.
  let state: DragState = IDLE;
  let layout: SortableLayout | null = null;
  let constraints: DragConstraints = REST_CONSTRAINTS;
  let pendingFrom = -1;
  let reduceMotion = false;
  let selectionSuppressed = false;

  const instructionsId = shallowRef<string | null>(null);
  onMounted(() => {
    if (messages !== null && keyboardEnabled) {
      instructionsId.value = ensureInstructionsElement(messages.instructions);
    }
  });

  function isDisabled(): boolean {
    return toValue(options.disabled) ?? false;
  }

  function say(message: string | null): void {
    if (message !== null) announce(message);
  }

  const pointerSession = createPointerSession({
    onMove: (point, pointerId) => {
      if (isDisabled()) {
        cancelSort();
        return;
      }
      applyTransition(movePointer(state, pointerId, point, constraints));
    },
    onUp: (pointerId) => {
      applyTransition(release(state, pointerId));
    },
    onCancel: () => {
      cancelSort();
    },
  });

  /** Measure geometry and freeze constraints for a new session. */
  function beginMeasured(index: number): boolean {
    const containerElement = toValue(container);
    if (containerElement === null || containerElement === undefined) return false;
    const elements: Element[] = [];
    for (const element of containerElement.querySelectorAll(":scope > [data-draggavue-index]")) {
      elements[Number(element.getAttribute("data-draggavue-index"))] = element;
    }
    if (elements.length === 0) return false;
    const orientation = toValue(options.orientation) ?? "vertical";
    layout = layoutFromRects(elements.map(measureRect), orientation, index);
    constraints = {
      ...REST_CONSTRAINTS,
      axis: orientation === "vertical" ? "y" : "x",
      activationDistance: px(toValue(options.activationDistance) ?? 0),
    };
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pendingFrom = index;
    return true;
  }

  function applyTransition(transition: DragTransition): void {
    state = transition.state;
    if (state.status === "idle") endSession();
    switch (transition.effect) {
      case "none":
        return;
      case "started": {
        suppressUserSelect();
        selectionSuppressed = true;
        active.value = { from: pendingFrom, to: pendingFrom, offset: px(0) };
        say(messages && messages.grabbed(pendingFrom + 1, total()));
        options.onSortStart?.({ from: pendingFrom, to: pendingFrom });
        return;
      }
      case "moved": {
        // Keyboard steps update `active` themselves with an exact
        // target index; only pointer moves derive it from geometry.
        const current = active.value;
        if (current === null || layout === null) return;
        if (transition.session.source === "keyboard") return;
        const offset = px(mainAxisOffset(transition.session.delta, layout.orientation));
        const to = targetIndexOf(layout, current.from, offset);
        const changed = to !== current.to;
        active.value = { from: current.from, to, offset };
        if (changed) {
          say(messages && messages.moved(to + 1, total()));
          options.onSortMove?.({ from: current.from, to });
        }
        return;
      }
      case "committed": {
        const current = active.value;
        if (current === null) return;
        active.value = null;
        if (current.from !== current.to) {
          const event: SortEvent = { from: current.from, to: current.to };
          options.onReorder(reorder(toValue(options.items), current.from, current.to), event);
        }
        say(messages && messages.dropped(current.from + 1, current.to + 1));
        options.onSortEnd?.({ from: current.from, to: current.to });
        return;
      }
      case "canceled": {
        const current = active.value;
        if (current === null) return;
        active.value = null;
        say(messages && messages.canceled(current.from + 1));
        options.onSortCancel?.({ from: current.from, to: current.from });
      }
    }
  }

  function total(): number {
    return layout === null ? 0 : layout.centers.length;
  }

  function endSession(): void {
    pointerSession.end();
    if (selectionSuppressed) {
      restoreUserSelect();
      selectionSuppressed = false;
    }
  }

  function cancelSort(): void {
    applyTransition(cancelDrag(state));
    if (state.status === "idle") endSession();
  }

  function indexFromEvent(event: Event): number | null {
    const containerElement = toValue(container);
    if (containerElement === null || containerElement === undefined) return null;
    if (!isElement(event.target)) return null;
    const item = event.target.closest("[data-draggavue-index]");
    if (item === null || item.parentElement !== containerElement) return null;
    const index = Number(item.getAttribute("data-draggavue-index"));
    return Number.isInteger(index) ? index : null;
  }

  function onPointerDown(event: PointerEvent): void {
    if (isDisabled() || event.button !== 0 || state.status !== "idle") return;
    const index = indexFromEvent(event);
    if (index === null || !beginMeasured(index)) return;
    pointerSession.begin();
    applyTransition(press(state, event.pointerId, ORIGIN, pointFromEvent(event), constraints));
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!keyboardEnabled || isDisabled()) return;
    const index = indexFromEvent(event);
    if (index === null) return;
    const grabbed = state.status === "dragging" && state.source === "keyboard";
    const intent = intentFromKey(event.key, event.shiftKey, grabbed, DEFAULT_STEPS);
    if (intent.kind === "none") return;
    if (event.key !== "Tab") event.preventDefault();
    switch (intent.kind) {
      case "grab":
        if (state.status !== "idle" || !beginMeasured(index)) return;
        applyTransition(grab(state, ORIGIN));
        return;
      case "drop":
        applyTransition(commit(state));
        return;
      case "move":
        keyboardStep(intent.delta);
        return;
      case "cancel":
        cancelSort();
    }
  }

  /** Move the grabbed item exactly one slot along the list. */
  function keyboardStep(delta: Delta): void {
    const current = active.value;
    if (current === null || layout === null) return;
    const step = indexStepOf(delta, layout.orientation);
    const to = Math.min(Math.max(current.to + step, 0), layout.centers.length - 1);
    const fromCenter = layout.centers[current.from];
    const toCenter = layout.centers[to];
    if (step === 0 || to === current.to || fromCenter === undefined || toCenter === undefined) {
      return;
    }
    const offset = px(toCenter - fromCenter);
    const move: Delta =
      layout.orientation === "vertical"
        ? { dx: px(0), dy: px(offset - current.offset) }
        : { dx: px(offset - current.offset), dy: px(0) };
    applyTransition(moveBy(state, move, constraints));
    active.value = { from: current.from, to, offset };
    say(messages && messages.moved(to + 1, total()));
    options.onSortMove?.({ from: current.from, to });
  }

  function onFocusout(): void {
    if (state.status === "dragging" && state.source === "keyboard") cancelSort();
  }

  watch(
    computed(() => toValue(container) ?? null),
    (element, _previous, onCleanup) => {
      if (element === null) return;
      const controller = new AbortController();
      const listenerTarget: GlobalEventHandlers = element;
      const { signal } = controller;
      listenerTarget.addEventListener("pointerdown", onPointerDown, { signal });
      listenerTarget.addEventListener("keydown", onKeydown, { signal });
      listenerTarget.addEventListener("focusout", onFocusout, { signal });
      onCleanup(() => {
        controller.abort();
      });
    },
    { immediate: true, flush: "post" },
  );

  if (getCurrentScope()) {
    onScopeDispose(endSession);
  }

  return {
    active: computed(() => active.value),
    isSorting,
    itemStyle: (index) =>
      sortableItemStyle(index, active.value, layout, neighborTransition, reduceMotion),
    itemAttrs: (index) =>
      sortableItemAttrs(index, active.value, {
        keyboardEnabled,
        roleDescription: (messages ?? DEFAULT_SORT_MESSAGES).roleDescription,
        instructionsId: instructionsId.value,
      }),
    cancel: cancelSort,
  };
}
