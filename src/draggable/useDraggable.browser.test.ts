import { afterEach, describe, expect, it } from "vitest";
import type { Ref } from "vue";
import { defineComponent, h, shallowRef, useTemplateRef } from "vue";
import type { Position } from "../shared/geometry";
import { px } from "../shared/units";
import {
  centerOf,
  dragBy,
  fireKey,
  firePointer,
  liveRegionText,
  mountComponent,
  nextFrames,
  resetLiveRegion,
  unmountAll,
} from "../testing/browser";
import type { UseDraggableOptions, UseDraggableReturn } from "./useDraggable";
import { useDraggable } from "./useDraggable";

type Harness = {
  readonly element: () => HTMLElement;
  readonly handle: () => HTMLElement;
  readonly drag: () => UseDraggableReturn;
  readonly unmount: () => void;
};

function setup(options: UseDraggableOptions = {}, { withHandle = false } = {}): Harness {
  let drag: UseDraggableReturn | null = null;
  const host = defineComponent({
    setup() {
      const box = useTemplateRef<HTMLElement>("box");
      const grip = useTemplateRef<HTMLElement>("grip");
      drag = useDraggable(box, withHandle ? { ...options, handle: grip } : options);
      return () =>
        h("div", { style: "width: 400px; height: 300px; position: relative; overflow: hidden;" }, [
          h(
            "div",
            {
              ref: "box",
              "data-testid": "box",
              ...drag?.attrs.value,
              style: [
                "width: 60px; height: 40px;",
                { transform: drag?.style.value.transform ?? "" },
              ],
            },
            withHandle ? [h("button", { ref: "grip", "data-testid": "grip" }, "grip")] : [],
          ),
        ]);
    },
  });
  const mounted = mountComponent(host);
  const query = (selector: string): HTMLElement => {
    const found = mounted.container.querySelector<HTMLElement>(selector);
    if (found === null) throw new Error(`${selector} not mounted`);
    return found;
  };
  return {
    element: () => query('[data-testid="box"]'),
    handle: () => query('[data-testid="grip"]'),
    drag: () => {
      if (drag === null) throw new Error("composable not ready");
      return drag;
    },
    unmount: mounted.unmount,
  };
}

const position = (x: number, y: number): Position => ({ x: px(x), y: px(y) });

afterEach(() => {
  unmountAll();
  resetLiveRegion();
});

describe("pointer dragging", () => {
  it("follows the pointer and commits on release", async () => {
    const harness = setup();
    await nextFrames();
    await dragBy(harness.element(), 120, 60);
    expect(harness.drag().position.value).toEqual(position(120, 60));
    expect(harness.drag().isDragging.value).toBe(false);
    expect(harness.element().style.transform).toBe("translate3d(120px, 60px, 0px)");
  });

  it("accumulates across sessions", async () => {
    const harness = setup();
    await nextFrames();
    await dragBy(harness.element(), 10, 10);
    await dragBy(harness.element(), 20, -5);
    expect(harness.drag().position.value).toEqual(position(30, 5));
  });

  it("reflects the live position mid-drag", async () => {
    const harness = setup();
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x + 40, y: start.y + 8 });
    await nextFrames();
    expect(harness.drag().isDragging.value).toBe(true);
    expect(harness.drag().position.value).toEqual(position(40, 8));
    expect(harness.element().dataset["dragging"]).toBe("true");
    firePointer(window, "pointerup", { x: start.x + 40, y: start.y + 8 });
    await nextFrames();
    expect(harness.element().dataset["dragging"]).toBeUndefined();
  });

  it("ignores non-primary buttons", async () => {
    const harness = setup();
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y, button: 2 });
    firePointer(window, "pointermove", { x: start.x + 50, y: start.y });
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(0, 0));
  });

  it("ignores foreign pointers during a session", async () => {
    const harness = setup();
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y, pointerId: 1 });
    firePointer(window, "pointermove", { x: start.x + 30, y: start.y, pointerId: 2 });
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(0, 0));
    firePointer(window, "pointerup", { x: start.x, y: start.y, pointerId: 2 });
    await nextFrames();
    expect(harness.drag().isDragging.value).toBe(true);
    firePointer(window, "pointerup", { x: start.x, y: start.y, pointerId: 1 });
    await nextFrames();
    expect(harness.drag().isDragging.value).toBe(false);
  });

  it("suppresses text selection only while dragging", async () => {
    const harness = setup();
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x + 10, y: start.y });
    await nextFrames();
    expect(document.body.style.userSelect).toBe("none");
    firePointer(window, "pointerup", { x: start.x + 10, y: start.y });
    await nextFrames();
    expect(document.body.style.userSelect).toBe("");
  });
});

describe("constraints", () => {
  it("locks movement to the x axis", async () => {
    const harness = setup({ axis: "x" });
    await nextFrames();
    await dragBy(harness.element(), 50, 50);
    expect(harness.drag().position.value).toEqual(position(50, 0));
  });

  it("snaps deltas to the grid", async () => {
    const harness = setup({ grid: [px(24), px(24)] });
    await nextFrames();
    await dragBy(harness.element(), 30, 50);
    expect(harness.drag().position.value).toEqual(position(24, 48));
  });

  it("clamps to the parent bounds", async () => {
    const harness = setup({ bounds: "parent" });
    await nextFrames();
    await dragBy(harness.element(), 1000, 1000);
    expect(harness.drag().position.value).toEqual(position(340, 260));
  });

  it("stays a click below the activation distance", async () => {
    const harness = setup({ activationDistance: 10 });
    await nextFrames();
    await dragBy(harness.element(), 4, 0);
    expect(harness.drag().position.value).toEqual(position(0, 0));
    expect(liveRegionText()).toBe("");
  });

  it("activates past the activation distance", async () => {
    const harness = setup({ activationDistance: 10 });
    await nextFrames();
    await dragBy(harness.element(), 24, 0);
    expect(harness.drag().position.value).toEqual(position(24, 0));
  });

  it("does not start while disabled", async () => {
    const disabled = shallowRef(true);
    const harness = setup({ disabled });
    await nextFrames();
    await dragBy(harness.element(), 40, 0);
    expect(harness.drag().position.value).toEqual(position(0, 0));
    disabled.value = false;
    await dragBy(harness.element(), 40, 0);
    expect(harness.drag().position.value).toEqual(position(40, 0));
  });
});

describe("handle", () => {
  it("starts from the handle, not the target body", async () => {
    const harness = setup({}, { withHandle: true });
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x + 30, y: start.y });
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(0, 0));
    await dragBy(harness.handle(), 30, 0);
    expect(harness.drag().position.value).toEqual(position(30, 0));
  });

  it("pins touch-action on the handle and restores it on unmount", async () => {
    const harness = setup({}, { withHandle: true });
    await nextFrames();
    expect(harness.handle().style.touchAction).toBe("none");
    expect(harness.element().style.touchAction).toBe("");
    harness.unmount();
  });
});

describe("cancelation", () => {
  it("restores the origin on Escape", async () => {
    const harness = setup();
    await nextFrames();
    await dragBy(harness.element(), 15, 0);
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x + 60, y: start.y });
    await nextFrames();
    fireKey(window, "Escape");
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(15, 0));
    expect(liveRegionText()).toBe("Drag canceled. Position restored.");
  });

  it("cancels on pointercancel", async () => {
    const harness = setup();
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x + 60, y: start.y });
    await nextFrames();
    firePointer(window, "pointercancel", { x: start.x + 60, y: start.y });
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(0, 0));
    expect(harness.drag().isDragging.value).toBe(false);
  });

  it("cancels programmatically", async () => {
    const harness = setup();
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x + 60, y: start.y });
    await nextFrames();
    harness.drag().cancel();
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(0, 0));
  });

  it("keeps working after an unmount mid-drag", async () => {
    const harness = setup();
    await nextFrames();
    const start = centerOf(harness.element());
    firePointer(harness.element(), "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x + 20, y: start.y });
    await nextFrames();
    harness.unmount();
    firePointer(window, "pointermove", { x: start.x + 90, y: start.y });
    await nextFrames();
    expect(document.body.style.userSelect).toBe("");
  });
});

describe("keyboard", () => {
  it("grabs, moves, and drops", async () => {
    const harness = setup();
    await nextFrames();
    const element = harness.element();
    fireKey(element, " ");
    expect(liveRegionText()).toBe("Grabbed draggable item at x 0, y 0.");
    fireKey(element, "ArrowRight");
    fireKey(element, "ArrowDown");
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(10, 10));
    expect(liveRegionText()).toBe("Moved to x 10, y 10.");
    fireKey(element, "Enter");
    await nextFrames();
    expect(harness.drag().isDragging.value).toBe(false);
    expect(harness.drag().position.value).toEqual(position(10, 10));
    expect(liveRegionText()).toBe("Dropped at x 10, y 10.");
  });

  it("moves by the fine step with shift", async () => {
    const harness = setup();
    await nextFrames();
    const element = harness.element();
    fireKey(element, " ");
    fireKey(element, "ArrowLeft", true);
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(-1, 0));
    fireKey(element, "Escape");
  });

  it("applies constraints to keyboard moves", async () => {
    const harness = setup({ axis: "y", keyboard: { step: px(4) } });
    await nextFrames();
    const element = harness.element();
    fireKey(element, " ");
    fireKey(element, "ArrowDown");
    fireKey(element, "ArrowRight");
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(0, 4));
    fireKey(element, "Escape");
  });

  it("cancels the grab when focus leaves", async () => {
    const harness = setup();
    await nextFrames();
    const element = harness.element();
    element.focus();
    fireKey(element, " ");
    fireKey(element, "ArrowRight");
    await nextFrames();
    element.blur();
    await nextFrames();
    expect(harness.drag().isDragging.value).toBe(false);
    expect(harness.drag().position.value).toEqual(position(0, 0));
  });

  it("opts out with keyboard: false", async () => {
    const harness = setup({ keyboard: false });
    await nextFrames();
    const element = harness.element();
    expect(element.getAttribute("tabindex")).toBeNull();
    expect(element.getAttribute("role")).toBeNull();
    fireKey(element, " ");
    await nextFrames();
    expect(harness.drag().isDragging.value).toBe(false);
  });
});

describe("accessibility surface", () => {
  it("exposes the WAI-ARIA attributes", async () => {
    const harness = setup();
    await nextFrames();
    const element = harness.element();
    expect(element.getAttribute("role")).toBe("button");
    expect(element.getAttribute("tabindex")).toBe("0");
    expect(element.getAttribute("aria-roledescription")).toBe("draggable");
    const describedby = element.getAttribute("aria-describedby");
    expect(describedby).not.toBeNull();
    expect(document.getElementById(describedby ?? "")?.textContent).toContain(
      "Press space or enter to grab",
    );
  });

  it("supports custom messages", async () => {
    const harness = setup({
      a11y: {
        grabbed: () => "つかみました。",
        roleDescription: "ドラッグ可能",
      },
    });
    await nextFrames();
    expect(harness.element().getAttribute("aria-roledescription")).toBe("ドラッグ可能");
    fireKey(harness.element(), " ");
    expect(liveRegionText()).toBe("つかみました。");
    fireKey(harness.element(), "Escape");
  });

  it("stays silent with a11y: false", async () => {
    const harness = setup({ a11y: false });
    await nextFrames();
    await dragBy(harness.element(), 25, 0);
    expect(liveRegionText()).toBe("");
    expect(harness.drag().position.value).toEqual(position(25, 0));
  });
});

describe("programmatic control", () => {
  it("honors an external position ref (controlled)", async () => {
    const external: Ref<Position> = shallowRef(position(5, 5));
    const harness = setup({ position: external });
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(5, 5));
    await dragBy(harness.element(), 10, 0);
    expect(external.value).toEqual(position(15, 5));
    external.value = position(100, 100);
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(100, 100));
  });

  it("supports setPosition and reset", async () => {
    const harness = setup({ initialPosition: position(7, 7) });
    await nextFrames();
    expect(harness.drag().position.value).toEqual(position(7, 7));
    harness.drag().setPosition(position(50, 60));
    expect(harness.drag().position.value).toEqual(position(50, 60));
    harness.drag().reset();
    expect(harness.drag().position.value).toEqual(position(7, 7));
  });

  it("fires callbacks in order", async () => {
    const calls: string[] = [];
    const harness = setup({
      onDragStart: () => calls.push("start"),
      onDragMove: () => calls.push("move"),
      onDragEnd: (settled) => calls.push(`end:${settled.x},${settled.y}`),
      onDragCancel: () => calls.push("cancel"),
    });
    await nextFrames();
    await dragBy(harness.element(), 30, 0);
    expect(calls[0]).toBe("start");
    expect(calls).toContain("move");
    expect(calls.at(-1)).toBe("end:30,0");
  });
});
