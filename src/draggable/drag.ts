import type { Axis, Delta, Grid, Position, Rect, Size } from "../shared/geometry";
import {
  ZERO_DELTA,
  clampToRect,
  constrainToAxis,
  deltaBetween,
  magnitude,
  snapToGrid,
  translate,
} from "../shared/geometry";
import type { Px } from "../shared/units";
import { px } from "../shared/units";

// --- Types & Signatures ---

/**
 * How an active drag session is being driven.
 *
 * The source decides which transitions are meaningful — pointer
 * sessions listen to {@link movePointer} / {@link release}, keyboard
 * sessions to {@link moveBy} / {@link commit} — and lets consumers
 * tune behavior per input (e.g. announce keyboard moves but keep
 * pointer moves silent).
 */
export type DragSource = "pointer" | "keyboard";

/** No interaction in flight. The one and only instance is {@link IDLE}. */
export type Idle = { readonly status: "idle" };

/**
 * A pointer is down but the activation distance has not been
 * reached yet.
 *
 * Nothing is visually dragging in this state — releasing here
 * degrades to an ordinary click, which is what makes
 * `activationDistance` safe on elements with interactive content.
 */
export type Pending = {
  readonly status: "pending";
  readonly pointerId: number;
  /** The element's settled position when the press began. */
  readonly origin: Position;
  /** Where the pointer pressed, in client coordinates. */
  readonly pointerStart: Position;
};

/** An active session driven by a pointer. */
export type PointerDragging = {
  readonly status: "dragging";
  readonly source: "pointer";
  readonly pointerId: number;
  /** The element's settled position when the session started. */
  readonly origin: Position;
  /** Where the pointer pressed, in client coordinates. */
  readonly pointerStart: Position;
  /** Constrained translation applied on top of `origin`. */
  readonly delta: Delta;
};

/** An active session driven by the keyboard. */
export type KeyboardDragging = {
  readonly status: "dragging";
  readonly source: "keyboard";
  /** The element's settled position when the session started. */
  readonly origin: Position;
  /** Constrained translation applied on top of `origin`. */
  readonly delta: Delta;
};

/** Any active session, regardless of input source. */
export type Dragging = PointerDragging | KeyboardDragging;

/**
 * Drag session lifecycle as an algebraic data type.
 *
 * ```text
 * pointer:  idle ──press──▶ pending ──move past threshold──▶ dragging ──release──▶ idle
 * keyboard: idle ──grab──▶ dragging ──commit / cancel──▶ idle
 * ```
 *
 * Impossible field combinations are unrepresentable: a keyboard
 * session has no `pointerId` to forget, a pending press has no
 * `delta` to misread. Pattern-match on `status` first, then on
 * `source` when dragging.
 *
 * @example Deriving a label from the state
 * ```ts
 * const label =
 *   state.status === "dragging"
 *     ? state.source === "keyboard"
 *       ? "keyboard drag"
 *       : "pointer drag"
 *     : state.status; // "idle" | "pending"
 * ```
 */
export type DragState = Idle | Pending | Dragging;

/**
 * Bounding constraint in *offset space*: keep an element of `size`
 * fully inside `rect`.
 *
 * The reactivity layer converts DOM measurements into this shape
 * once per session, so the state machine never touches the DOM.
 */
export type DragBounds = {
  readonly rect: Rect;
  readonly size: Size;
};

/**
 * Everything that shapes how far a session may move, snapshotted
 * once when the session starts.
 *
 * @see {@link resolveDelta} for how the pieces compose.
 */
export type DragConstraints = {
  readonly axis: Axis;
  readonly grid: Grid | null;
  readonly bounds: DragBounds | null;
  /** Travel required before a press becomes a drag. `0` starts instantly. */
  readonly activationDistance: Px;
};

/**
 * Result of a transition: the next state plus the side effect the
 * caller should perform.
 *
 * Every transition function returns one of these, and invalid
 * transitions come back as `{ state, effect: "none" }` rather than
 * throwing — callers can feed events in unconditionally and only
 * pattern-match on `effect`:
 *
 * - `"none"` — nothing observable happened
 * - `"started"` — a session began; `session` is the live state
 * - `"moved"` — the element moved; `session` carries the new delta
 * - `"committed"` — the session ended at `position`
 * - `"canceled"` — the session ended, restoring `position`
 *
 * All decisions happen here in pure code; the reactivity layer just
 * fires callbacks and updates refs.
 */
export type DragTransition =
  | { readonly state: DragState; readonly effect: "none" }
  | { readonly state: DragState; readonly effect: "started"; readonly session: Dragging }
  | { readonly state: DragState; readonly effect: "moved"; readonly session: Dragging }
  | { readonly state: DragState; readonly effect: "committed"; readonly position: Position }
  | { readonly state: DragState; readonly effect: "canceled"; readonly position: Position };

export type resolveDelta = (origin: Position, raw: Delta, constraints: DragConstraints) => Delta;
export type press = (
  state: DragState,
  pointerId: number,
  origin: Position,
  pointerStart: Position,
  constraints: DragConstraints,
) => DragTransition;
export type movePointer = (
  state: DragState,
  pointerId: number,
  point: Position,
  constraints: DragConstraints,
) => DragTransition;
export type release = (state: DragState, pointerId: number) => DragTransition;
export type grab = (state: DragState, origin: Position) => DragTransition;
export type moveBy = (
  state: DragState,
  step: Delta,
  constraints: DragConstraints,
) => DragTransition;
export type commit = (state: DragState) => DragTransition;
export type cancel = (state: DragState) => DragTransition;

// --- Implementation ---

/** The idle state singleton — every session starts and ends here. */
export const IDLE: Idle = { status: "idle" };

const none = (state: DragState): DragTransition => ({ state, effect: "none" });

const deltasEqual = (a: Delta, b: Delta): boolean => a.dx === b.dx && a.dy === b.dy;

/**
 * Apply the full constraint pipeline to a raw delta.
 *
 * Order matters and is fixed: **axis lock → grid snap → bounds
 * clamp**. Snapping happens on the axis-constrained delta so a
 * diagonal pointer path cannot smuggle movement into a locked axis,
 * and clamping happens last so the result always respects bounds
 * exactly — even when a grid step would overshoot them.
 *
 * @param origin - The session's start position; bounds are clamped
 * relative to it.
 * @param raw - Unconstrained translation (pointer travel or
 * accumulated keyboard steps).
 * @param constraints - The session's frozen constraint snapshot.
 * @returns The furthest legal delta in the direction of `raw`.
 *
 * @example
 * ```ts
 * const constraints: DragConstraints = {
 *   axis: "x",
 *   grid: [px(10), px(10)],
 *   bounds: null,
 *   activationDistance: px(0),
 * };
 *
 * resolveDelta(ORIGIN, { dx: px(14), dy: px(99) }, constraints);
 * // => { dx: 10, dy: 0 } — axis first, then snap
 * ```
 */
export const resolveDelta: resolveDelta = (origin, raw, constraints) => {
  const onAxis = constrainToAxis(raw, constraints.axis);
  const snapped = constraints.grid === null ? onAxis : snapToGrid(onAxis, constraints.grid);

  if (constraints.bounds === null) return snapped;

  const clamped = clampToRect(
    translate(origin, snapped),
    constraints.bounds.size,
    constraints.bounds.rect,
  );
  return deltaBetween(origin, clamped);
};

/**
 * A pointer pressed on the handle: `idle → pending` (or straight to
 * `dragging` when the activation distance is zero).
 *
 * Pressing in any non-idle state is a no-op — a second pointer
 * cannot steal an in-flight session.
 *
 * @param origin - The element's settled position at press time.
 * @param pointerStart - The press point in client coordinates.
 */
export const press: press = (state, pointerId, origin, pointerStart, constraints) => {
  if (state.status !== "idle") return none(state);

  const pending: Pending = { status: "pending", pointerId, origin, pointerStart };
  if (constraints.activationDistance > 0) return none(pending);

  const session: PointerDragging = {
    ...pending,
    status: "dragging",
    source: "pointer",
    delta: ZERO_DELTA,
  };
  return { state: session, effect: "started", session };
};

/**
 * The session pointer moved.
 *
 * Three outcomes:
 *
 * - `pending` and the pointer has now traveled past the activation
 *   distance → `"started"`, with the initial delta already resolved
 *   so the element doesn't jump.
 * - `dragging` and the constrained delta changed → `"moved"`.
 * - anything else (foreign pointer, no visible change after
 *   constraints) → `"none"`. Suppressing unchanged deltas means
 *   grid users get render-free frames for free.
 */
export const movePointer: movePointer = (state, pointerId, point, constraints) => {
  if (state.status === "pending" && state.pointerId === pointerId) {
    const traveled = magnitude(deltaBetween(state.pointerStart, point));
    if (traveled < constraints.activationDistance) return none(state);

    const session: PointerDragging = {
      ...state,
      status: "dragging",
      source: "pointer",
      delta: resolveDelta(state.origin, deltaBetween(state.pointerStart, point), constraints),
    };
    return { state: session, effect: "started", session };
  }

  if (state.status === "dragging" && state.source === "pointer" && state.pointerId === pointerId) {
    const delta = resolveDelta(state.origin, deltaBetween(state.pointerStart, point), constraints);
    if (deltasEqual(delta, state.delta)) return none(state);

    const session: PointerDragging = { ...state, delta };
    return { state: session, effect: "moved", session };
  }

  return none(state);
};

/**
 * The session pointer was released.
 *
 * A release before activation quietly returns to idle — the press
 * was just a click. A release mid-drag commits at
 * `origin + delta`. Releases from foreign pointers are ignored.
 */
export const release: release = (state, pointerId) => {
  if (state.status === "pending" && state.pointerId === pointerId) return none(IDLE);

  if (state.status === "dragging" && state.source === "pointer" && state.pointerId === pointerId) {
    return { state: IDLE, effect: "committed", position: translate(state.origin, state.delta) };
  }

  return none(state);
};

/**
 * Keyboard grab: `idle → dragging` with a zero delta.
 *
 * Grabbing while any session is active is a no-op, mirroring
 * {@link press}.
 *
 * @param origin - The element's settled position at grab time.
 */
export const grab: grab = (state, origin) => {
  if (state.status !== "idle") return none(state);

  const session: KeyboardDragging = {
    status: "dragging",
    source: "keyboard",
    origin,
    delta: ZERO_DELTA,
  };
  return { state: session, effect: "started", session };
};

/**
 * Nudge the active session by a step (arrow keys, or any
 * programmatic relative move).
 *
 * The step accumulates onto the current delta and re-enters the
 * constraint pipeline, so grid/axis/bounds hold for keyboard input
 * exactly as they do for pointers. A step that constraints reduce
 * to nothing returns `"none"`.
 */
export const moveBy: moveBy = (state, step, constraints) => {
  if (state.status !== "dragging") return none(state);

  const raw: Delta = { dx: px(state.delta.dx + step.dx), dy: px(state.delta.dy + step.dy) };
  const delta = resolveDelta(state.origin, raw, constraints);
  if (deltasEqual(delta, state.delta)) return none(state);

  const session: Dragging = { ...state, delta };
  return { state: session, effect: "moved", session };
};

/**
 * Commit the active session where it stands: `dragging → idle`,
 * reporting `origin + delta` as the final position.
 *
 * This is the keyboard counterpart of {@link release} — space/enter
 * drop the grabbed element.
 */
export const commit: commit = (state) => {
  if (state.status !== "dragging") return none(state);

  return { state: IDLE, effect: "committed", position: translate(state.origin, state.delta) };
};

/**
 * Abort the session and restore the origin.
 *
 * From `dragging` this reports `"canceled"` with the origin so the
 * caller can move the element back. From `pending` it resets
 * silently (`"none"`) — nothing ever moved, so there is nothing to
 * announce or restore.
 */
export const cancel: cancel = (state) => {
  if (state.status === "pending") return none(IDLE);

  if (state.status === "dragging")
    return { state: IDLE, effect: "canceled", position: state.origin };

  return none(state);
};
