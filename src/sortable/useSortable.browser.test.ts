import { afterEach, describe, expect, it } from "vitest";
import type { Ref } from "vue";
import { defineComponent, h, ref, useTemplateRef } from "vue";
import {
  centerOf,
  fireKey,
  firePointer,
  liveRegionText,
  mountComponent,
  nextFrames,
  resetLiveRegion,
  unmountAll,
} from "../testing/browser";
import type { SortEvent, UseSortableOptions, UseSortableReturn } from "./useSortable";
import { useSortable } from "./useSortable";

type Harness = {
  readonly items: Ref<readonly string[]>;
  readonly rows: () => HTMLElement[];
  readonly row: (label: string) => HTMLElement;
  readonly sortable: () => UseSortableReturn;
  readonly events: SortEvent[];
};

type HarnessOptions = Partial<UseSortableOptions<string>>;

function setup(labels: readonly string[], options: HarnessOptions = {}): Harness {
  const items = ref<readonly string[]>(labels);
  const events: SortEvent[] = [];
  let sortable: UseSortableReturn | null = null;
  const host = defineComponent({
    setup() {
      const list = useTemplateRef<HTMLElement>("list");
      sortable = useSortable(list, {
        ...options,
        items: () => items.value,
        onReorder: (next, event) => {
          items.value = next;
          events.push(event);
        },
      });
      return () =>
        h(
          "ul",
          { ref: "list", style: "margin: 0; padding: 0; list-style: none; width: 200px;" },
          items.value.map((label, index) =>
            h(
              "li",
              {
                key: label,
                ...sortable?.itemAttrs(index),
                style: [
                  "height: 40px; margin: 0 0 10px; box-sizing: border-box;",
                  { ...sortable?.itemStyle(index) },
                ],
              },
              [h("span", { "data-label": label }, label)],
            ),
          ),
        );
    },
  });
  const mounted = mountComponent(host);
  const rows = (): HTMLElement[] => [...mounted.container.querySelectorAll("li")];
  return {
    items,
    rows,
    row: (label) => {
      const found = rows().find((candidate) => candidate.textContent === label);
      if (found === undefined) throw new Error(`row ${label} not found`);
      return found;
    },
    sortable: () => {
      if (sortable === null) throw new Error("composable not ready");
      return sortable;
    },
    events,
  };
}

/** Row pitch is 50px (40px row + 10px gap). */
async function dragRowBy(row: HTMLElement, dy: number): Promise<void> {
  const start = centerOf(row);
  firePointer(row, "pointerdown", { x: start.x, y: start.y });
  firePointer(window, "pointermove", { x: start.x, y: start.y + dy / 2 });
  await nextFrames();
  firePointer(window, "pointermove", { x: start.x, y: start.y + dy });
  await nextFrames();
  firePointer(window, "pointerup", { x: start.x, y: start.y + dy });
  await nextFrames();
}

afterEach(() => {
  unmountAll();
  resetLiveRegion();
});

describe("pointer reordering", () => {
  it("moves an item down across two slots", async () => {
    const harness = setup(["a", "b", "c", "d"]);
    await nextFrames();
    await dragRowBy(harness.row("a"), 105);
    expect(harness.items.value).toEqual(["b", "c", "a", "d"]);
    expect(harness.events).toEqual([{ from: 0, to: 2 }]);
    expect(liveRegionText()).toBe("Dropped. Moved from position 1 to position 3.");
  });

  it("moves an item up", async () => {
    const harness = setup(["a", "b", "c", "d"]);
    await nextFrames();
    await dragRowBy(harness.row("d"), -160);
    expect(harness.items.value).toEqual(["d", "a", "b", "c"]);
    expect(harness.events).toEqual([{ from: 3, to: 0 }]);
  });

  it("does not reorder below the half-slot threshold", async () => {
    const harness = setup(["a", "b", "c"]);
    await nextFrames();
    await dragRowBy(harness.row("a"), 20);
    expect(harness.items.value).toEqual(["a", "b", "c"]);
    expect(harness.events).toEqual([]);
    expect(liveRegionText()).toBe("Dropped back at position 1.");
  });

  it("shifts neighbors while dragging and restores them after", async () => {
    const harness = setup(["a", "b", "c"]);
    await nextFrames();
    const first = harness.row("a");
    const start = centerOf(first);
    firePointer(first, "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x, y: start.y + 60 });
    await nextFrames();
    const styles = harness.rows().map((row) => row.style.transform);
    expect(styles[0]).toBe("translate3d(0px, 60px, 0px)");
    expect(styles[1]).toBe("translate3d(0px, -50px, 0px)");
    expect(styles[2]).toBe("translate3d(0px, 0px, 0px)");
    expect(harness.rows()[0]?.style.zIndex).toBe("1");
    expect(harness.rows()[0]?.style.transition).toBe("none");
    firePointer(window, "pointerup", { x: start.x, y: start.y + 60 });
    await nextFrames();
    expect(harness.rows().every((row) => row.style.transform === "")).toBe(true);
  });

  it("cancels with Escape and leaves the order untouched", async () => {
    const harness = setup(["a", "b", "c"]);
    await nextFrames();
    const first = harness.row("a");
    const start = centerOf(first);
    firePointer(first, "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x, y: start.y + 80 });
    await nextFrames();
    fireKey(window, "Escape");
    await nextFrames();
    expect(harness.items.value).toEqual(["a", "b", "c"]);
    expect(harness.sortable().isSorting.value).toBe(false);
    expect(liveRegionText()).toBe("Reorder canceled. Item stays at position 1.");
  });

  it("respects disabled", async () => {
    const harness = setup(["a", "b"], { disabled: true });
    await nextFrames();
    await dragRowBy(harness.row("a"), 60);
    expect(harness.items.value).toEqual(["a", "b"]);
  });

  it("starts from nested elements through delegation", async () => {
    const harness = setup(["a", "b", "c"]);
    await nextFrames();
    const nested = harness.row("a").querySelector<HTMLElement>("[data-label]");
    if (nested === null) throw new Error("nested span missing");
    await dragRowBy(nested, 60);
    expect(harness.items.value).toEqual(["b", "a", "c"]);
  });
});

describe("keyboard reordering", () => {
  it("grabs, steps, and drops with announcements", async () => {
    const harness = setup(["a", "b", "c"]);
    await nextFrames();
    const first = harness.row("a");
    fireKey(first, " ");
    expect(liveRegionText()).toBe("Grabbed item at position 1 of 3.");
    fireKey(first, "ArrowDown");
    await nextFrames();
    expect(liveRegionText()).toBe("Moved to position 2 of 3.");
    expect(harness.sortable().active.value).toMatchObject({ from: 0, to: 1 });
    fireKey(first, " ");
    await nextFrames();
    expect(harness.items.value).toEqual(["b", "a", "c"]);
    expect(liveRegionText()).toBe("Dropped. Moved from position 1 to position 2.");
  });

  it("clamps steps at the list edges", async () => {
    const harness = setup(["a", "b"]);
    await nextFrames();
    const first = harness.row("a");
    fireKey(first, " ");
    fireKey(first, "ArrowUp");
    await nextFrames();
    expect(harness.sortable().active.value).toMatchObject({ from: 0, to: 0 });
    fireKey(first, "ArrowDown");
    fireKey(first, "ArrowDown");
    fireKey(first, "ArrowDown");
    await nextFrames();
    expect(harness.sortable().active.value).toMatchObject({ from: 0, to: 1 });
    fireKey(first, "Escape");
  });

  it("ignores horizontal arrows in a vertical list", async () => {
    const harness = setup(["a", "b"]);
    await nextFrames();
    const first = harness.row("a");
    fireKey(first, " ");
    fireKey(first, "ArrowRight");
    await nextFrames();
    expect(harness.sortable().active.value).toMatchObject({ from: 0, to: 0 });
    fireKey(first, "Escape");
  });

  it("cancels when focus leaves the grabbed item", async () => {
    const harness = setup(["a", "b"]);
    await nextFrames();
    const first = harness.row("a");
    first.focus();
    fireKey(first, " ");
    fireKey(first, "ArrowDown");
    await nextFrames();
    first.blur();
    await nextFrames();
    expect(harness.sortable().isSorting.value).toBe(false);
    expect(harness.items.value).toEqual(["a", "b"]);
  });
});

describe("rendering contract", () => {
  it("marks items with the delegation index and aria attributes", async () => {
    const harness = setup(["a", "b"]);
    await nextFrames();
    const first = harness.row("a");
    expect(first.getAttribute("data-draggavue-index")).toBe("0");
    expect(first.getAttribute("role")).toBe("button");
    expect(first.getAttribute("tabindex")).toBe("0");
    expect(first.getAttribute("aria-roledescription")).toBe("sortable item");
    expect(first.style.touchAction).toBe("none");
  });

  it("drops aria affordances when keyboard is off, keeps delegation", async () => {
    const harness = setup(["a", "b"], { keyboard: false });
    await nextFrames();
    const first = harness.row("a");
    expect(first.getAttribute("data-draggavue-index")).toBe("0");
    expect(first.getAttribute("role")).toBeNull();
    expect(first.getAttribute("tabindex")).toBeNull();
  });

  it("applies the neighbor transition only when motion is allowed", async () => {
    const harness = setup(["a", "b", "c"], { transition: "transform 99ms linear" });
    await nextFrames();
    const first = harness.row("a");
    const start = centerOf(first);
    firePointer(first, "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x, y: start.y + 60 });
    await nextFrames();
    expect(harness.row("b").style.transition).toBe("transform 99ms linear");
    firePointer(window, "pointerup", { x: start.x, y: start.y + 60 });
    await nextFrames();
  });

  it("omits the transition when disabled via option", async () => {
    const harness = setup(["a", "b", "c"], { transition: false });
    await nextFrames();
    const first = harness.row("a");
    const start = centerOf(first);
    firePointer(first, "pointerdown", { x: start.x, y: start.y });
    firePointer(window, "pointermove", { x: start.x, y: start.y + 60 });
    await nextFrames();
    expect(harness.row("b").style.transition).toBe("");
    fireKey(window, "Escape");
    await nextFrames();
  });
});
