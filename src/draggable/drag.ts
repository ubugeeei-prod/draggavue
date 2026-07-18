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

/** How an active drag session is being driven. */
export type DragSource = "pointer" | "keyboard";

export type Idle = { readonly status: "idle" };

/** Pointer is down but the activation distance has not been reached yet. */
export type Pending = {
  readonly status: "pending";
  readonly pointerId: number;
  readonly origin: Position;
  readonly pointerStart: Position;
};

export type PointerDragging = {
  readonly status: "dragging";
  readonly source: "pointer";
  readonly pointerId: number;
  readonly origin: Position;
  readonly pointerStart: Position;
  readonly delta: Delta;
};

export type KeyboardDragging = {
  readonly status: "dragging";
  readonly source: "keyboard";
  readonly origin: Position;
  readonly delta: Delta;
};

export type Dragging = PointerDragging | KeyboardDragging;

/**
 * Drag session lifecycle as an ADT.
 *
 * `idle -> pending -> dragging -> idle` for pointers,
 * `idle -> dragging -> idle` for keyboards. Impossible field
 * combinations (e.g. a keyboard session with a pointer id) do not
 * exist at the type level.
 */
export type DragState = Idle | Pending | Dragging;

/** Bounding constraint: keep `size` fully inside `rect`. */
export type DragBounds = {
  readonly rect: Rect;
  readonly size: Size;
};

export type DragConstraints = {
  readonly axis: Axis;
  readonly grid: Grid | null;
  readonly bounds: DragBounds | null;
  readonly activationDistance: Px;
};

/**
 * Result of a transition: the next state plus the side effect the
 * caller should perform. The reactivity layer only pattern-matches
 * on `effect` — all decisions happen here, in pure code.
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

export const IDLE: Idle = { status: "idle" };

const none = (state: DragState): DragTransition => ({ state, effect: "none" });

const deltasEqual = (a: Delta, b: Delta): boolean => a.dx === b.dx && a.dy === b.dy;

/** Apply axis, grid, and bounds constraints to a raw delta. */
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

export const release: release = (state, pointerId) => {
  if (state.status === "pending" && state.pointerId === pointerId) return none(IDLE);
  if (state.status === "dragging" && state.source === "pointer" && state.pointerId === pointerId) {
    return { state: IDLE, effect: "committed", position: translate(state.origin, state.delta) };
  }
  return none(state);
};

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

export const moveBy: moveBy = (state, step, constraints) => {
  if (state.status !== "dragging") return none(state);
  const raw: Delta = { dx: px(state.delta.dx + step.dx), dy: px(state.delta.dy + step.dy) };
  const delta = resolveDelta(state.origin, raw, constraints);
  if (deltasEqual(delta, state.delta)) return none(state);
  const session: Dragging = { ...state, delta };
  return { state: session, effect: "moved", session };
};

export const commit: commit = (state) => {
  if (state.status !== "dragging") return none(state);
  return { state: IDLE, effect: "committed", position: translate(state.origin, state.delta) };
};

export const cancel: cancel = (state) => {
  if (state.status === "pending") return none(IDLE);
  if (state.status === "dragging")
    return { state: IDLE, effect: "canceled", position: state.origin };
  return none(state);
};
