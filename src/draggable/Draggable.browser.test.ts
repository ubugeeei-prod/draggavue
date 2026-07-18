import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, shallowRef, useTemplateRef } from "vue";
import type { Position } from "../shared/geometry";
import { px } from "../shared/units";
import {
  dragBy,
  mountComponent,
  nextFrames,
  resetLiveRegion,
  unmountAll,
} from "../testing/browser";
import type { DraggableExposed } from "./Draggable";
import { Draggable } from "./Draggable";

const position = (x: number, y: number): Position => ({ x: px(x), y: px(y) });

afterEach(() => {
  unmountAll();
  resetLiveRegion();
});

describe("Draggable component (browser)", () => {
  it("renders the tag, slot props, and aria attributes", async () => {
    const mounted = mountComponent(
      defineComponent({
        setup() {
          return () =>
            h(
              Draggable,
              { tag: "article" },
              {
                default: (slot: { isDragging: boolean; position: Position }) =>
                  h("span", `${slot.isDragging}:${slot.position.x}`),
              },
            );
        },
      }),
    );
    await nextFrames();
    const root = mounted.container.querySelector("article");
    expect(root).not.toBeNull();
    expect(root?.getAttribute("role")).toBe("button");
    expect(root?.textContent).toBe("false:0");
  });

  it("drags uncontrolled from initialPosition and emits lifecycle events", async () => {
    const events: string[] = [];
    const mounted = mountComponent(
      defineComponent({
        setup() {
          return () =>
            h(Draggable, {
              initialPosition: position(5, 5),
              "onDrag:start": () => events.push("start"),
              "onDrag:move": () => events.push("move"),
              "onDrag:end": (settled: Position) => events.push(`end:${settled.x},${settled.y}`),
              "onUpdate:position": (next: Position) => events.push(`update:${next.x},${next.y}`),
            });
        },
      }),
    );
    await nextFrames();
    const root = mounted.container.querySelector<HTMLElement>("[aria-roledescription]");
    if (root === null) throw new Error("root not found");
    await dragBy(root, 20, 10);
    expect(events[0]).toBe("start");
    expect(events).toContain("update:25,15");
    expect(events.at(-1)).toBe("end:25,15");
    expect(root.style.transform).toBe("translate3d(25px, 15px, 0px)");
  });

  it("follows a controlled position prop", async () => {
    const controlled = shallowRef(position(40, 0));
    const mounted = mountComponent(
      defineComponent({
        setup() {
          return () =>
            h(Draggable, {
              position: controlled.value,
              "onUpdate:position": (next: Position) => {
                controlled.value = next;
              },
            });
        },
      }),
    );
    await nextFrames();
    const root = mounted.container.querySelector<HTMLElement>("[aria-roledescription]");
    if (root === null) throw new Error("root not found");
    expect(root.style.transform).toBe("translate3d(40px, 0px, 0px)");
    await dragBy(root, 10, 10);
    expect(controlled.value).toEqual(position(50, 10));
    controlled.value = position(0, 0);
    await nextFrames();
    expect(root.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });

  it("exposes setPosition, reset, and cancel through the template ref", async () => {
    let exposed: DraggableExposed | null = null;
    mountComponent(
      defineComponent({
        setup() {
          const draggable = useTemplateRef<DraggableExposed>("draggable");
          return () => {
            exposed = draggable.value;
            return h(Draggable, { ref: "draggable", initialPosition: position(3, 3) });
          };
        },
      }),
    );
    await nextFrames();
    if (exposed === null) throw new Error("expose not ready");
    const surface: DraggableExposed = exposed;
    expect(surface.element).not.toBeNull();
    surface.setPosition(position(80, 90));
    await nextFrames();
    expect(surface.element?.style.transform).toBe("translate3d(80px, 90px, 0px)");
    surface.reset();
    await nextFrames();
    expect(surface.element?.style.transform).toBe("translate3d(3px, 3px, 0px)");
  });
});
