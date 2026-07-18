import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";
import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch } from "vue";
import type { DraggableElement, ElementTarget } from "../shared/dom";
import {
  isElement,
  measureRect,
  pointFromEvent,
  restoreUserSelect,
  suppressUserSelect,
} from "../shared/dom";
import type { Axis, Grid, Position, Rect } from "../shared/geometry";
import { ORIGIN, translate } from "../shared/geometry";
import { px } from "../shared/units";
import type { DragBounds, DragConstraints, DragState, DragTransition, Dragging } from "./drag";
import { IDLE, cancel as cancelDrag, movePointer, press, release } from "./drag";

// --- Types & Signatures ---

/** Bounding option: an element, a client rect, or the direct parent. */
export type BoundsOption = DraggableElement | Rect | "parent";

export interface DraggableCallbacks {
  onDragStart?: (session: Dragging) => void;
  onDragMove?: (session: Dragging) => void;
  onDragEnd?: (position: Position) => void;
  onDragCancel?: (position: Position) => void;
}

export interface UseDraggableOptions extends DraggableCallbacks {
  /** Settled position at rest. Defaults to `{ x: 0, y: 0 }`. */
  initialPosition?: Position;
  /**
   * Own the position from outside (controlled mode). Committed
   * positions are written back into this ref.
   */
  position?: Ref<Position>;
  /** Constrain movement to one axis. */
  axis?: MaybeRefOrGetter<Axis | undefined>;
  /** Snap deltas to a `[x, y]` pixel grid. */
  grid?: MaybeRefOrGetter<Grid | null | undefined>;
  /** Keep the element fully inside the given bounds while dragging. */
  bounds?: MaybeRefOrGetter<BoundsOption | null | undefined>;
  /** Drag handle. Defaults to the target element itself. */
  handle?: ElementTarget;
  /** Reactively disable dragging. An active session is canceled. */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  /** Pixels the pointer must travel before the drag activates. */
  activationDistance?: number;
}

export type DraggableStyle = {
  readonly transform: string;
  readonly willChange?: "transform";
};

export interface UseDraggableReturn {
  /** Live position: follows the pointer per frame, settles on release. */
  position: ComputedRef<Position>;
  /** Read-only view of the drag session state. */
  state: ComputedRef<DragState>;
  isDragging: ComputedRef<boolean>;
  /** Bind to `:style` of the target element. */
  style: ComputedRef<DraggableStyle>;
  /** Overwrite the settled position. */
  setPosition: (next: Position) => void;
  /** Restore the initial position. */
  reset: () => void;
  /** Programmatically cancel the active session. */
  cancel: () => void;
}

const FREE_CONSTRAINTS: DragConstraints = {
  axis: "both",
  grid: null,
  bounds: null,
  activationDistance: px(0),
};

/**
 * Pointer-driven drag behavior for a single element.
 *
 * Headless: this composable computes positions and a `transform`
 * style; rendering stays fully in the caller's hands. All movement
 * decisions live in the pure state machine (`drag.ts`) — this layer
 * only wires DOM events and applies transition effects.
 */
export function useDraggable(
  target: ElementTarget,
  options: UseDraggableOptions = {},
): UseDraggableReturn {
  const { initialPosition = ORIGIN, activationDistance = 0 } = options;

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

  function resolveConstraints(): DragConstraints {
    return {
      axis: toValue(options.axis) ?? "both",
      grid: toValue(options.grid) ?? null,
      bounds: resolveBounds(),
      activationDistance: px(activationDistance),
    };
  }

  function containerRectOf(raw: BoundsOption, element: DraggableElement): Rect | null {
    if (raw === "parent") {
      const parent = element.parentElement;
      return parent === null ? null : measureRect(parent);
    }
    return isElement(raw) ? measureRect(raw) : raw;
  }

  /**
   * Bounds are measured once per session, in "offset space": the
   * container rect is shifted by the element's untranslated page
   * position, so the pure layer clamps offsets without ever touching
   * the DOM again.
   */
  function resolveBounds(): DragBounds | null {
    const element = toValue(target);
    const raw = toValue(options.bounds) ?? null;
    if (element === null || element === undefined || raw === null) return null;
    const containerRect = containerRectOf(raw, element);
    if (containerRect === null) return null;
    const elementRect = measureRect(element);
    const current = settled.value;
    return {
      rect: {
        left: px(containerRect.left - (elementRect.left - current.x)),
        top: px(containerRect.top - (elementRect.top - current.y)),
        width: containerRect.width,
        height: containerRect.height,
      },
      size: { width: elementRect.width, height: elementRect.height },
    };
  }

  function applyTransition(transition: DragTransition): void {
    state.value = transition.state;
    // Tear down before user callbacks run so a throwing callback can
    // never leak window listeners.
    if (transition.state.status === "idle") endSession();
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
    if (toValue(options.disabled) ?? false) return;
    if (event.button !== 0) return;
    if (state.value.status !== "idle") return;
    constraints = resolveConstraints();
    beginSession();
    applyTransition(
      press(state.value, event.pointerId, settled.value, pointFromEvent(event), constraints),
    );
  }

  function onPointerMove(event: PointerEvent): void {
    if (toValue(options.disabled) ?? false) {
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

  function setPosition(next: Position): void {
    settled.value = next;
  }

  function reset(): void {
    setPosition(initialPosition);
  }

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
      // Widening to GlobalEventHandlers keeps the typed `pointerdown`
      // overload across the HTMLElement | SVGElement union.
      const listenerTarget: GlobalEventHandlers = element;
      listenerTarget.addEventListener("pointerdown", onPointerDown, {
        signal: controller.signal,
      });
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
    setPosition,
    reset,
    cancel: cancelSession,
  };
}
