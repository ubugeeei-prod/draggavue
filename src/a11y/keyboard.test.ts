import { describe, expect, it } from "vitest";
import { px } from "../shared/units";
import type { KeyboardSteps } from "./keyboard";
import { DEFAULT_STEPS, intentFromKey } from "./keyboard";

const steps: KeyboardSteps = { step: px(10), fineStep: px(1) };

describe("intentFromKey", () => {
  it("grabs with space or enter when idle", () => {
    expect(intentFromKey(" ", false, false, steps)).toEqual({ kind: "grab" });
    expect(intentFromKey("Enter", false, false, steps)).toEqual({ kind: "grab" });
  });

  it("drops with space or enter while grabbed", () => {
    expect(intentFromKey(" ", false, true, steps)).toEqual({ kind: "drop" });
    expect(intentFromKey("Enter", false, true, steps)).toEqual({ kind: "drop" });
  });

  it("moves with arrow keys while grabbed", () => {
    expect(intentFromKey("ArrowUp", false, true, steps)).toEqual({
      kind: "move",
      delta: { dx: 0, dy: -10 },
    });
    expect(intentFromKey("ArrowRight", false, true, steps)).toEqual({
      kind: "move",
      delta: { dx: 10, dy: 0 },
    });
  });

  it("uses the fine step while shift is held", () => {
    expect(intentFromKey("ArrowDown", true, true, steps)).toEqual({
      kind: "move",
      delta: { dx: 0, dy: 1 },
    });
  });

  it("ignores arrows when not grabbed", () => {
    expect(intentFromKey("ArrowUp", false, false, steps)).toEqual({ kind: "none" });
  });

  it("cancels with escape or tab while grabbed", () => {
    expect(intentFromKey("Escape", false, true, steps)).toEqual({ kind: "cancel" });
    expect(intentFromKey("Tab", false, true, steps)).toEqual({ kind: "cancel" });
  });

  it("ignores escape when idle", () => {
    expect(intentFromKey("Escape", false, false, steps)).toEqual({ kind: "none" });
  });

  it("ignores unrelated keys", () => {
    expect(intentFromKey("a", false, true, steps)).toEqual({ kind: "none" });
    expect(intentFromKey("Home", false, true, DEFAULT_STEPS)).toEqual({ kind: "none" });
  });
});
