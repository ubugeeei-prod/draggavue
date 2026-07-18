import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, ref } from "vue";
import {
  dragBy,
  mountComponent,
  nextFrames,
  resetLiveRegion,
  unmountAll,
} from "../testing/browser";
import { SortableList } from "./SortableList";
import type { SortEvent } from "./useSortable.def";

type Todo = { readonly id: number; readonly title: string };

afterEach(() => {
  unmountAll();
  resetLiveRegion();
});

describe("SortableList component (browser)", () => {
  it("renders items through the typed slot and reorders on drag", async () => {
    const todos = ref<readonly Todo[]>([
      { id: 1, title: "one" },
      { id: 2, title: "two" },
      { id: 3, title: "three" },
    ]);
    const sorts: SortEvent[] = [];
    const mounted = mountComponent(
      defineComponent({
        setup() {
          return () =>
            h(
              SortableList<Todo>,
              {
                items: todos.value,
                itemKey: (todo: Todo) => todo.id,
                style: "display: block; margin: 0; padding: 0; width: 200px;",
                "onUpdate:items": (next: readonly Todo[]) => {
                  todos.value = next;
                },
                "onSort:end": (event: SortEvent) => {
                  sorts.push(event);
                },
              },
              {
                item: (slot: { item: Todo; index: number; isDragging: boolean }) =>
                  h("span", `${slot.index}:${slot.item.title}`),
              },
            );
        },
      }),
    );
    await nextFrames();
    const rows = [...mounted.container.querySelectorAll("li")];
    expect(rows.map((row) => row.textContent)).toEqual(["0:one", "1:two", "2:three"]);
    for (const row of rows) row.style.height = "40px";
    const first = rows[0];
    if (first === undefined) throw new Error("row missing");
    await dragBy(first, 0, 45);
    expect(todos.value.map((todo) => todo.title)).toEqual(["two", "one", "three"]);
    expect(sorts).toEqual([{ from: 0, to: 1 }]);
  });

  it("renders custom tags", async () => {
    const mounted = mountComponent(
      defineComponent({
        setup() {
          return () =>
            h(
              SortableList<Todo>,
              {
                tag: "ol",
                itemTag: "div",
                items: [{ id: 1, title: "solo" }] as readonly Todo[],
                itemKey: (todo: Todo) => todo.id,
              },
              {
                item: (slot: { item: Todo }) => h("em", slot.item.title),
              },
            );
        },
      }),
    );
    await nextFrames();
    expect(mounted.container.querySelector("ol > div > em")?.textContent).toBe("solo");
  });
});
