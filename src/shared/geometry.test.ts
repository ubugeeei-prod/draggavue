import { describe, expect, it } from "vitest";
import {
  clampToRect,
  constrainToAxis,
  deltaBetween,
  magnitude,
  snapToGrid,
  translate,
} from "./geometry";
import type { Delta, Grid, Position, Rect, Size } from "./geometry";
import { px } from "./units";

const position = (x: number, y: number): Position => ({ x: px(x), y: px(y) });
const delta = (dx: number, dy: number): Delta => ({ dx: px(dx), dy: px(dy) });

describe("translate", () => {
  it("moves a position by a delta", () => {
    expect(translate(position(10, 20), delta(5, -8))).toEqual(position(15, 12));
  });
});

describe("deltaBetween", () => {
  it("computes the delta from one position to another", () => {
    expect(deltaBetween(position(10, 20), position(4, 26))).toEqual(delta(-6, 6));
  });

  it("round-trips with translate", () => {
    const from = position(3, 7);
    const to = position(-11, 42);
    expect(translate(from, deltaBetween(from, to))).toEqual(to);
  });
});

describe("magnitude", () => {
  it("returns the euclidean length of a delta", () => {
    expect(magnitude(delta(3, 4))).toBe(5);
  });

  it("is zero for the zero delta", () => {
    expect(magnitude(delta(0, 0))).toBe(0);
  });
});

describe("constrainToAxis", () => {
  const moved = delta(12, -7);

  it("passes deltas through on both axes", () => {
    expect(constrainToAxis(moved, "both")).toEqual(moved);
  });

  it("zeroes the vertical movement on the x axis", () => {
    expect(constrainToAxis(moved, "x")).toEqual(delta(12, 0));
  });

  it("zeroes the horizontal movement on the y axis", () => {
    expect(constrainToAxis(moved, "y")).toEqual(delta(0, -7));
  });
});

describe("snapToGrid", () => {
  const grid: Grid = [px(10), px(25)];

  it("snaps each component to the nearest grid cell", () => {
    expect(snapToGrid(delta(14, 37), grid)).toEqual(delta(10, 25));
    expect(snapToGrid(delta(15, 38), grid)).toEqual(delta(20, 50));
  });

  it("snaps negative deltas symmetrically", () => {
    expect(snapToGrid(delta(-14, -38), grid)).toEqual(delta(-10, -50));
  });

  it("leaves components alone when the cell size is zero", () => {
    expect(snapToGrid(delta(14, 37), [px(0), px(25)])).toEqual(delta(14, 25));
  });
});

describe("clampToRect", () => {
  const size: Size = { width: px(20), height: px(10) };
  const bounds: Rect = { left: px(0), top: px(0), width: px(100), height: px(50) };

  it("keeps positions already inside the bounds", () => {
    expect(clampToRect(position(30, 20), size, bounds)).toEqual(position(30, 20));
  });

  it("clamps positions past the top-left corner", () => {
    expect(clampToRect(position(-5, -5), size, bounds)).toEqual(position(0, 0));
  });

  it("clamps so the element stays fully inside the bottom-right corner", () => {
    expect(clampToRect(position(95, 45), size, bounds)).toEqual(position(80, 40));
  });

  it("pins to the bounds origin when the element is larger than the bounds", () => {
    const oversized: Size = { width: px(200), height: px(100) };
    expect(clampToRect(position(30, 20), oversized, bounds)).toEqual(position(0, 0));
  });
});
