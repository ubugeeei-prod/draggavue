import { describe, expect, it } from "vitest";
import type { Rect } from "../shared/geometry";
import { px } from "../shared/units";
import type { SortableLayout } from "./sortable";
import {
  indexStepOf,
  layoutFromRects,
  mainAxisOffset,
  reorder,
  shiftFor,
  targetIndexOf,
} from "./sortable";

const rowRect = (top: number, height = 40): Rect => ({
  left: px(0),
  top: px(top),
  width: px(200),
  height: px(height),
});

// Four 40px rows with a 10px gap: tops at 0, 50, 100, 150.
const rows = [rowRect(0), rowRect(50), rowRect(100), rowRect(150)];

describe("reorder", () => {
  const items = ["a", "b", "c", "d"] as const;

  it("moves an item down", () => {
    expect(reorder(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item up", () => {
    expect(reorder(items, 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns the same array when nothing moves", () => {
    expect(reorder(items, 2, 2)).toBe(items);
  });

  it("ignores out-of-range indices", () => {
    expect(reorder(items, -1, 2)).toBe(items);
    expect(reorder(items, 0, 4)).toBe(items);
  });
});

describe("layoutFromRects", () => {
  it("captures main-axis centers", () => {
    const layout = layoutFromRects(rows, "vertical", 0);
    expect(layout.centers).toEqual([20, 70, 120, 170]);
  });

  it("derives the shift distance from size plus gap", () => {
    expect(layoutFromRects(rows, "vertical", 1).shift).toBe(50);
  });

  it("measures along the x axis for horizontal lists", () => {
    const columns: Rect[] = [
      { left: px(0), top: px(0), width: px(80), height: px(40) },
      { left: px(90), top: px(0), width: px(80), height: px(40) },
    ];
    const layout = layoutFromRects(columns, "horizontal", 0);
    expect(layout.centers).toEqual([40, 130]);
    expect(layout.shift).toBe(90);
  });

  it("handles a single-item list", () => {
    const layout = layoutFromRects([rowRect(0)], "vertical", 0);
    expect(layout.shift).toBe(40);
  });
});

describe("targetIndexOf", () => {
  const layout: SortableLayout = layoutFromRects(rows, "vertical", 0);

  it("stays put for small offsets", () => {
    expect(targetIndexOf(layout, 1, px(0))).toBe(1);
    expect(targetIndexOf(layout, 1, px(30))).toBe(1);
  });

  it("targets the last passed center when moving down", () => {
    expect(targetIndexOf(layout, 0, px(60))).toBe(1);
    expect(targetIndexOf(layout, 0, px(160))).toBe(3);
  });

  it("targets the first passed center when moving up", () => {
    expect(targetIndexOf(layout, 3, px(-60))).toBe(2);
    expect(targetIndexOf(layout, 3, px(-160))).toBe(0);
  });
});

describe("shiftFor", () => {
  it("shifts items between origin and target up while dragging down", () => {
    expect(shiftFor(1, 0, 2, px(50))).toBe(-50);
    expect(shiftFor(2, 0, 2, px(50))).toBe(-50);
    expect(shiftFor(3, 0, 2, px(50))).toBe(0);
  });

  it("shifts items between target and origin down while dragging up", () => {
    expect(shiftFor(1, 3, 1, px(50))).toBe(50);
    expect(shiftFor(2, 3, 1, px(50))).toBe(50);
    expect(shiftFor(0, 3, 1, px(50))).toBe(0);
  });

  it("leaves the dragged index alone", () => {
    expect(shiftFor(0, 0, 2, px(50))).toBe(0);
  });
});

describe("keyboard mapping", () => {
  it("projects deltas onto the main axis", () => {
    expect(mainAxisOffset({ dx: px(3), dy: px(-8) }, "vertical")).toBe(-8);
    expect(mainAxisOffset({ dx: px(3), dy: px(-8) }, "horizontal")).toBe(3);
  });

  it("turns deltas into index steps", () => {
    expect(indexStepOf({ dx: px(0), dy: px(-10) }, "vertical")).toBe(-1);
    expect(indexStepOf({ dx: px(0), dy: px(10) }, "vertical")).toBe(1);
    expect(indexStepOf({ dx: px(10), dy: px(0) }, "vertical")).toBe(0);
    expect(indexStepOf({ dx: px(-10), dy: px(0) }, "horizontal")).toBe(-1);
  });
});
