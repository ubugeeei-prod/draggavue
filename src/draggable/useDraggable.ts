import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch } from "vue";
import type { DraggableElement, ElementTarget } from "../shared/dom";
import { pointFromEvent, restoreUserSelect, suppressUserSelect } from "../shared/dom";
import type { Position } from "../shared/geometry";
import { ORIGIN, translate } from "../shared/geometry";
import { createPointerSession } from "../shared/pointerSession";
import { px } from "../shared/units";
import type { ConstraintOptions } from "./constraints";
import { FREE_CONSTRAINTS, resolveConstraints } from "./constraints";
import type { DragConstraints, DragState, DragTransition, Dragging } from "./drag";
import {
  IDLE,
  cancel as cancelDrag,
  commit,
  grab,
  moveBy,
  movePointer,
  press,
  release,
} from "./drag";
import type { DragA11yOptions, DraggableAttrs } from "./dragA11y";
import { useDragA11y } from "./dragA11y";

// --- Types & Signatures ---

export interface DraggableCallbacks {
  /**
   * Fired once when a session activates: a pointer press that
   * traveled past {@link ConstraintOptions.activationDistance}, or a
   * keyboard grab.
   */
  onDragStart?: ((session: Dragging) => void) | undefined;
  /**
   * Fired while the element moves — at most once per animation
   * frame for pointers, once per step for keyboard moves.
   */
  onDragMove?: ((session: Dragging) => void) | undefined;
  /** Fired when the session commits, with the settled position. */
  onDragEnd?: ((position: Position) => void) | undefined;
  /**
   * Fired when the session cancels (Escape, `pointercancel`, window
   * blur, focus loss, `disabled` flipping on, or `cancel()`), with
   * the restored position.
   */
  onDragCancel?: ((position: Position) => void) | undefined;
}

export interface UseDraggableOptions
  extends ConstraintOptions, DragA11yOptions, DraggableCallbacks {
  /**
   * Settled position at rest.
   *
   * @default ORIGIN ({ x: 0, y: 0 })
   */
  initialPosition?: Position | undefined;
  /**
   * Own the position from outside (controlled mode). The composable
   * reads the settled position from this ref and writes committed
   * positions back into it — hand it a ref you own to persist,
   * synchronize, or drive the position externally.
   *
   * @default undefined (an internal ref is created)
   * @example
   * ```ts
   * const saved = shallowRef<Position>(restoreFromStorage());
   * useDraggable(box, { position: saved });
   * watch(saved, persistToStorage);
   * ```
   */
  position?: Ref<Position> | undefined;
  /**
   * Drag handle: only presses on this element start a session.
   * Keyboard focus and ARIA attributes move to the handle too.
   *
   * @default undefined (the target element is its own handle)
   */
  handle?: ElementTarget | undefined;
  /**
   * Reactively disable dragging. Turning this on mid-session
   * cancels the session and restores the origin.
   *
   * @default false
   */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * Inline style for the target element: a `translate3d` transform
 * (never `left`/`top`, so moving costs no layout), plus
 * `will-change` only while a session is live to keep the layer
 * budget honest at rest.
 */
export type DraggableStyle = {
  readonly transform: string;
  readonly willChange?: "transform";
};

export interface UseDraggableReturn {
  /**
   * Live position: follows the input per frame while dragging and
   * settles to the committed value on release.
   */
  position: ComputedRef<Position>;
  /**
   * Read-only view of the session state machine — pattern-match on
   * `status` (and `source` while dragging) for advanced rendering.
   */
  state: ComputedRef<DragState>;
  isDragging: ComputedRef<boolean>;
  /** Bind to `:style` of the target element. */
  style: ComputedRef<DraggableStyle>;
  /**
   * Spread onto the handle element (`v-bind="drag.attrs.value"`):
   * WAI-ARIA attributes, keyboard affordances, and the
   * `data-dragging` / `data-draggavue` styling hooks.
   */
  attrs: ComputedRef<DraggableAttrs>;
  /**
   * Overwrite the settled position, e.g. to restore a persisted
   * layout. Ignored by an in-flight session until it settles.
   */
  setPosition: (next: Position) => void;
  /** Restore {@link UseDraggableOptions.initialPosition}. */
  reset: () => void;
  /** Cancel the active session and restore the origin. */
  cancel: () => void;
}

/**
 * Headless, accessible drag behavior for a single element.
 *
 * Pointer and keyboard input drive the same pure state machine, so
 * every constraint (axis, grid, bounds, activation distance)
 * behaves identically for both. Accessibility is on by default:
 * WAI-ARIA attributes via {@link UseDraggableReturn.attrs}, the
 * space/arrows/escape keyboard grammar, and live-region
 * announcements (replace or disable them with
 * {@link DragA11yOptions.a11y}).
 *
 * Performance notes: rendering is `transform`-only (no layout),
 * pointer moves collapse to one state update per animation frame,
 * geometry is measured once per session, and window listeners exist
 * only while a session is live. SSR-safe — the DOM is never touched
 * until an interaction starts.
 *
 * @param target - Element to move: a `useTemplateRef()` result, any
 * ref/getter, or a raw element.
 * @param options - Constraints, a11y, keyboard tuning, callbacks,
 * and control mode. Reactive options accept refs or getters and are
 * snapshotted at session start.
 * @returns Reactive session state plus imperative controls — see
 * {@link UseDraggableReturn}.
 *
 * @example Minimal
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
 *   <div ref="box" v-bind="drag.attrs.value" :style="drag.style.value">Drag me</div>
 * </template>
 * ```
 *
 * @example Constrained, with a handle
 * ```ts
 * const card = useTemplateRef<HTMLElement>("card");
 * const grip = useTemplateRef<HTMLElement>("grip");
 * const drag = useDraggable(card, {
 *   handle: grip,
 *   axis: "x",
 *   grid: [px(8), px(8)],
 *   bounds: "parent",
 *   activationDistance: 4,
 *   onDragEnd: (position) => save(position),
 * });
 * ```
 */
export function useDraggable(
  target: ElementTarget,
  options: UseDraggableOptions = {},
): UseDraggableReturn {
  const { initialPosition = ORIGIN } = options;

  // Immutable snapshots swapped per frame — deep reactivity would
  // only add proxy overhead on the hot path.
  const state = shallowRef<DragState>(IDLE);
  const settled: Ref<Position> = options.position ?? shallowRef(initialPosition);

  const isDragging = computed(() => state.value.status === "dragging");
  const position = computed<Position>(() => {
    const current = state.value;
    return current.status === "dragging" ? translate(current.origin, current.delta) : settled.value;
  });
  const style = computed<DraggableStyle>(() => {
    const { x, y } = position.value;
    const transform = `translate3d(${x}px, ${y}px, 0)`;
    return isDragging.value ? { transform, willChange: "transform" } : { transform };
  });

  // Session-scoped plumbing; none of it needs reactivity.
  let constraints: DragConstraints = FREE_CONSTRAINTS;
  let selectionSuppressed = false;

  const pointerSession = createPointerSession({
    onMove: (point, pointerId) => {
      if (isDisabled()) {
        cancelSession();
        return;
      }
      applyTransition(movePointer(state.value, pointerId, point, constraints));
    },
    onUp: (pointerId) => {
      applyTransition(release(state.value, pointerId));
    },
    onCancel: () => {
      cancelSession();
    },
  });

  function isDisabled(): boolean {
    return toValue(options.disabled) ?? false;
  }

  function applyTransition(transition: DragTransition): void {
    state.value = transition.state;
    // Tear down before user callbacks run so a throwing callback can
    // never leak window listeners.
    if (transition.state.status === "idle") endSession();
    a11y.announceTransition(transition);
    switch (transition.effect) {
      case "none":
        return;
      case "started":
        suppressUserSelect();
        selectionSuppressed = true;
        options.onDragStart?.(transition.session);
        return;
      case "moved":
        options.onDragMove?.(transition.session);
        return;
      case "committed":
        settled.value = transition.position;
        options.onDragEnd?.(transition.position);
        return;
      case "canceled":
        options.onDragCancel?.(transition.position);
    }
  }

  function onPointerDown(event: PointerEvent): void {
    if (isDisabled() || event.button !== 0) return;
    if (state.value.status !== "idle") return;
    constraints = resolveConstraints(target, options, settled.value);
    pointerSession.begin();
    applyTransition(
      press(state.value, event.pointerId, settled.value, pointFromEvent(event), constraints),
    );
  }

  function endSession(): void {
    pointerSession.end();
    if (selectionSuppressed) {
      restoreUserSelect();
      selectionSuppressed = false;
    }
  }

  function cancelSession(): void {
    applyTransition(cancelDrag(state.value));
    // A pending press cancels silently (`effect: none`) — make sure
    // its listeners are gone too.
    if (state.value.status === "idle") endSession();
  }

  const a11y = useDragA11y(
    {
      getState: () => state.value,
      isDisabled,
      grab: () => {
        if (state.value.status !== "idle") return;
        constraints = resolveConstraints(target, options, settled.value);
        applyTransition(grab(state.value, settled.value));
      },
      moveBy: (dx, dy) => {
        applyTransition(moveBy(state.value, { dx: px(dx), dy: px(dy) }, constraints));
      },
      drop: () => {
        applyTransition(commit(state.value));
      },
      cancel: cancelSession,
    },
    options,
  );

  // The handle only exists after mount (template refs) and may be
  // swapped by v-if — a watcher is the reactive wiring point.
  const handleElement = computed<DraggableElement | null>(
    () => toValue(options.handle) ?? toValue(target) ?? null,
  );
  watch(
    handleElement,
    (element, _previous, onCleanup) => {
      if (element === null) return;
      const controller = new AbortController();
      // Widening to GlobalEventHandlers keeps the typed event
      // overloads across the HTMLElement | SVGElement union.
      const listenerTarget: GlobalEventHandlers = element;
      const { signal } = controller;
      listenerTarget.addEventListener("pointerdown", onPointerDown, { signal });
      listenerTarget.addEventListener("keydown", a11y.onKeydown, { signal });
      listenerTarget.addEventListener("focusout", a11y.onFocusout, { signal });
      // Without this, mobile browsers claim the gesture for scrolling
      // before the drag can activate.
      const elementStyle = element.style;
      const previousTouchAction = elementStyle.touchAction;
      elementStyle.touchAction = "none";
      onCleanup(() => {
        controller.abort();
        elementStyle.touchAction = previousTouchAction;
      });
    },
    { immediate: true, flush: "post" },
  );

  if (getCurrentScope()) {
    onScopeDispose(endSession);
  }

  return {
    position,
    state: computed(() => state.value),
    isDragging,
    style,
    attrs: a11y.attrs,
    setPosition: (next) => {
      settled.value = next;
    },
    reset: () => {
      settled.value = initialPosition;
    },
    cancel: cancelSession,
  };
}
