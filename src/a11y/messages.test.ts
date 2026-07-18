import { describe, expect, it } from "vitest";
import type { Position } from "../shared/geometry";
import { px } from "../shared/units";
import { DEFAULT_MESSAGES, DEFAULT_SORT_MESSAGES, describePosition } from "./messages";

const position = (x: number, y: number): Position => ({ x: px(x), y: px(y) });

describe("describePosition", () => {
  it("rounds subpixel coordinates for humans", () => {
    expect(describePosition(position(10.4, -3.6))).toBe("x 10, y -4");
  });
});

describe("DEFAULT_MESSAGES", () => {
  it("describes every lifecycle moment", () => {
    expect(DEFAULT_MESSAGES.grabbed(position(1, 2))).toBe("Grabbed draggable item at x 1, y 2.");
    expect(DEFAULT_MESSAGES.moved(position(10, 20))).toBe("Moved to x 10, y 20.");
    expect(DEFAULT_MESSAGES.dropped(position(3, 4))).toBe("Dropped at x 3, y 4.");
    expect(DEFAULT_MESSAGES.canceled(position(0, 0))).toBe("Drag canceled. Position restored.");
  });

  it("ships instructions and a role description", () => {
    expect(DEFAULT_MESSAGES.instructions).toContain("space or enter to grab");
    expect(DEFAULT_MESSAGES.roleDescription).toBe("draggable");
  });
});

describe("DEFAULT_SORT_MESSAGES", () => {
  it("speaks 1-based positions", () => {
    expect(DEFAULT_SORT_MESSAGES.grabbed(1, 5)).toBe("Grabbed item at position 1 of 5.");
    expect(DEFAULT_SORT_MESSAGES.moved(3, 5)).toBe("Moved to position 3 of 5.");
  });

  it("distinguishes a real move from a drop-back", () => {
    expect(DEFAULT_SORT_MESSAGES.dropped(2, 2)).toBe("Dropped back at position 2.");
    expect(DEFAULT_SORT_MESSAGES.dropped(1, 4)).toBe(
      "Dropped. Moved from position 1 to position 4.",
    );
  });

  it("names the resting position on cancel", () => {
    expect(DEFAULT_SORT_MESSAGES.canceled(3)).toBe("Reorder canceled. Item stays at position 3.");
  });
});
