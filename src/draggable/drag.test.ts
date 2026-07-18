import { describe, expect, it } from "vitest";
import type { Delta, Position } from "../shared/geometry";
import { px } from "../shared/units";
import type { DragConstraints, DragState } from "./drag";
import {
  IDLE,
  cancel,
  commit,
  grab,
  moveBy,
  movePointer,
  press,
  release,
  resolveDelta,
} from "./drag";

const position = (x: number, y: number): Position => ({ x: px(x), y: px(y) });
const delta = (dx: number, dy: number): Delta => ({ dx: px(dx), dy: px(dy) });

const free: DragConstraints = {
  axis: "both",
  grid: null,
  bounds: null,
  activationDistance: px(0),
};

const pressedAt = (constraints: DragConstraints = free): DragState =>
  press(IDLE, 1, position(100, 100), position(10, 10), constraints).state;

describe("resolveDelta", () => {
  it("applies axis before grid", () => {
    const constraints: DragConstraints = { ...free, axis: "x", grid: [px(10), px(10)] };
    expect(resolveDelta(position(0, 0), delta(14, 99), constraints)).toEqual(delta(10, 0));
  });

  it("clamps the resulting position to bounds", () => {
    const constraints: DragConstraints = {
      ...free,
      bounds: {
        rect: { left: px(0), top: px(0), width: px(100), height: px(100) },
        size: { width: px(20), height: px(20) },
      },
    };
    expect(resolveDelta(position(50, 50), delta(500, -500), constraints)).toEqual(delta(30, -50));
  });
});

describe("pointer path", () => {
  it("starts immediately when the activation distance is zero", () => {
    const transition = press(IDLE, 1, position(100, 100), position(10, 10), free);
    expect(transition.effect).toBe("started");
    expect(transition.state).toMatchObject({ status: "dragging", source: "pointer", pointerId: 1 });
  });

  it("stays pending until the pointer travels the activation distance", () => {
    const constraints: DragConstraints = { ...free, activationDistance: px(5) };
    const pending = pressedAt(constraints);
    expect(pending.status).toBe("pending");

    const under = movePointer(pending, 1, position(13, 10), constraints);
    expect(under.effect).toBe("none");
    expect(under.state.status).toBe("pending");

    const over = movePointer(pending, 1, position(16, 10), constraints);
    expect(over.effect).toBe("started");
    expect(over.state).toMatchObject({ status: "dragging", delta: delta(6, 0) });
  });

  it("tracks movement relative to the pointer start", () => {
    const dragging = pressedAt();
    const moved = movePointer(dragging, 1, position(25, 4), free);
    expect(moved.effect).toBe("moved");
    expect(moved.state).toMatchObject({ delta: delta(15, -6) });
  });

  it("reports no effect when the constrained delta does not change", () => {
    const constraints: DragConstraints = { ...free, grid: [px(100), px(100)] };
    const dragging = pressedAt(constraints);
    const moved = movePointer(dragging, 1, position(12, 11), constraints);
    expect(moved.effect).toBe("none");
  });

  it("ignores pointers that are not part of the session", () => {
    const dragging = pressedAt();
    expect(movePointer(dragging, 2, position(999, 999), free).effect).toBe("none");
    expect(release(dragging, 2).effect).toBe("none");
  });

  it("commits the translated position on release", () => {
    const dragging = movePointer(pressedAt(), 1, position(25, 4), free).state;
    const released = release(dragging, 1);
    expect(released).toMatchObject({
      effect: "committed",
      position: position(115, 94),
      state: { status: "idle" },
    });
  });

  it("treats release before activation as a plain click", () => {
    const constraints: DragConstraints = { ...free, activationDistance: px(5) };
    const released = release(pressedAt(constraints), 1);
    expect(released.effect).toBe("none");
    expect(released.state).toBe(IDLE);
  });
});

describe("keyboard path", () => {
  it("grabs from idle with a zero delta", () => {
    const grabbed = grab(IDLE, position(100, 100));
    expect(grabbed.effect).toBe("started");
    expect(grabbed.state).toMatchObject({ status: "dragging", source: "keyboard" });
  });

  it("does not grab while another session is active", () => {
    expect(grab(pressedAt(), position(0, 0)).effect).toBe("none");
  });

  it("accumulates steps through constraints", () => {
    const grabbed = grab(IDLE, position(100, 100)).state;
    const constraints: DragConstraints = { ...free, axis: "y" };
    const once = moveBy(grabbed, delta(10, 10), constraints);
    const twice = moveBy(once.state, delta(0, -35), constraints);
    expect(twice.state).toMatchObject({ delta: delta(0, -25) });
  });

  it("commits the accumulated position", () => {
    const grabbed = grab(IDLE, position(100, 100)).state;
    const moved = moveBy(grabbed, delta(10, 5), free).state;
    expect(commit(moved)).toMatchObject({ effect: "committed", position: position(110, 105) });
  });
});

describe("cancel", () => {
  it("restores the origin from a drag session", () => {
    const dragging = movePointer(pressedAt(), 1, position(80, 80), free).state;
    expect(cancel(dragging)).toMatchObject({
      effect: "canceled",
      position: position(100, 100),
      state: { status: "idle" },
    });
  });

  it("silently resets a pending press", () => {
    const constraints: DragConstraints = { ...free, activationDistance: px(5) };
    const canceled = cancel(pressedAt(constraints));
    expect(canceled.effect).toBe("none");
    expect(canceled.state).toBe(IDLE);
  });

  it("does nothing when idle", () => {
    expect(cancel(IDLE)).toMatchObject({ effect: "none", state: { status: "idle" } });
  });
});
