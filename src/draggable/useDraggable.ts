import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch } from "vue";
import type { DraggableElement, ElementTarget } from "../shared/dom";
import { pointFromEvent, restoreUserSelect, suppressUserSelect } from "../shared/dom";
import type { Position } from "../shared/geometry";
import { ORIGIN, translate } from "../shared/geometry";
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
  onDragStart?: ((session: Dragging) => void) | undefined;
  onDragMove?: ((session: Dragging) => void) | undefined;
  onDragEnd?: ((position: Position) => void) | undefined;
  onDragCancel?: ((position: Position) => void) | undefined;
}

export interface UseDraggableOptions
  extends ConstraintOptions, DragA11yOptions, DraggableCallbacks {
  /** Settled position at rest. Defaults to `{ x: 0, y: 0 }`. */
  initialPosition?: Position | undefined;
  /**
   * Own the position from outside (controlled mode). Committed
   * positions are written back into this ref.
   */
  position?: Ref<Position> | undefined;
  /** Drag handle. Defaults to the target element itself. */
  handle?: ElementTarget | undefined;
  /** Reactively disable dragging. An active session is canceled. */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}

export type DraggableStyle = {
  readonly transform: string;
  readonly willChange?: "transform";
};

export interface UseDraggableReturn {
  /** Live position: follows the input per frame, settles on release. */
  position: ComputedRef<Position>;
  /** Read-only view of the drag session state. */
  state: ComputedRef<DragState>;
  isDragging: ComputedRef<boolean>;
  /** Bind to `:style` of the target element. */
  style: ComputedRef<DraggableStyle>;
  /** Spread onto the handle: ARIA attributes + `data-dragging`. */
  attrs: ComputedRef<DraggableAttrs>;
  /** Overwrite the settled position. */
  setPosition: (next: Position) => void;
  /** Restore the initial position. */
  reset: () => void;
  /** Programmatically cancel the active session. */
  cancel: () => void;
}

/**
 * Headless, accessible drag behavior for a single element.
 *
 * The composable wires DOM events (pointer + keyboard) and applies
 * transition effects; every movement decision lives in the pure
 * state machine (`drag.ts`).
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
  let session: AbortController | null = null;
  let frame: number | null = null;
  let latestPoint: Position | null = null;
  let latestPointerId = -1;
  let selectionSuppressed = false;

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
    beginSession();
    applyTransition(
      press(state.value, event.pointerId, settled.value, pointFromEvent(event), constraints),
    );
  }

  function onPointerMove(event: PointerEvent): void {
    if (isDisabled()) {
      cancelSession();
      return;
    }
    latestPoint = pointFromEvent(event);
    latestPointerId = event.pointerId;
    // Coalesce to at most one state update per frame regardless of
    // the browser's pointermove cadence.
    frame ??= requestAnimationFrame(flushMove);
  }

  function flushMove(): void {
    frame = null;
    if (latestPoint === null) return;
    applyTransition(movePointer(state.value, latestPointerId, latestPoint, constraints));
  }

  function onPointerUp(event: PointerEvent): void {
    stopFrame();
    flushMove();
    applyTransition(release(state.value, event.pointerId));
  }

  function onSessionKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    cancelSession();
  }

  function beginSession(): void {
    session?.abort();
    session = new AbortController();
    const { signal } = session;
    window.addEventListener("pointermove", onPointerMove, { signal, passive: true });
    window.addEventListener("pointerup", onPointerUp, { signal });
    window.addEventListener("pointercancel", cancelSession, { signal });
    window.addEventListener("blur", cancelSession, { signal });
    window.addEventListener("keydown", onSessionKeydown, { signal });
  }

  function endSession(): void {
    session?.abort();
    session = null;
    stopFrame();
    latestPoint = null;
    if (selectionSuppressed) {
      restoreUserSelect();
      selectionSuppressed = false;
    }
  }

  function stopFrame(): void {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  }

  function cancelSession(): void {
    stopFrame();
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
