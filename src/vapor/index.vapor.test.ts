import { afterEach, describe, expect, it } from "vitest";
import * as vue from "vue";
import { dragBy, fireKey, nextFrames, resetLiveRegion } from "../testing/browser";
import VaporHarness from "../testing/fixtures/VaporHarness.vue";
import { Draggable, SortableList } from "./index";

// Vapor runtime APIs ship in vue@3.6-rc's with-vapor build (this
// project aliases `vue` to it) but are not in the public types yet.
// A local minimal surface keeps the test honest without `any`.
type VaporApp = { mount: (host: Element) => unknown; unmount: () => void };
type CreateVaporApp = (component: unknown, props?: Record<string, unknown>) => VaporApp;

const { createVaporApp } = vue as unknown as { createVaporApp: CreateVaporApp };

let app: VaporApp | null = null;
let host: HTMLElement | null = null;

function mountHarness(): HTMLElement {
  host = document.createElement("div");
  document.body.appendChild(host);
  app = createVaporApp(VaporHarness);
  app.mount(host);
  return host;
}

afterEach(() => {
  try {
    app?.unmount();
  } catch {
    // A component that crashed mid-mount may fail to unmount too.
  }
  host?.remove();
  app = null;
  host = null;
  resetLiveRegion();
});

describe("Vapor compilation", () => {
  it("compiles both components as genuine Vapor components", () => {
    const draggable = Draggable as unknown as Record<string, unknown>;
    const sortable = SortableList as unknown as Record<string, unknown>;

    expect(draggable["__vapor"]).toBe(true);
    expect(sortable["__vapor"]).toBe(true);
  });
});

/**
 * Upstream canaries.
 *
 * Slot-bearing components cannot mount under Vize's Vapor output
 * yet — `<slot>` compiles to the vdom `renderSlot` helper
 * (ubugeeei-prod/vize#3073; see also #3072 for props tracking).
 *
 * Each spec below states the *intended* behavior and is wrapped in
 * `it.fails`: the moment a Vize release fixes the codegen, these
 * start passing, `it.fails` flips the suite red, and we promote
 * them to regular tests (and restore props destructure in the
 * SFCs).
 */
describe("Vapor runtime (canaries for vize#3073)", () => {
  it.fails("renders both components inside a Vapor app", async () => {
    const root = mountHarness();
    await nextFrames();

    const drag = root.querySelector<HTMLElement>('[data-harness="drag"]');
    expect(drag?.textContent).toBe("payload");
    expect(drag?.getAttribute("role")).toBe("button");

    const items = root.querySelectorAll("[data-draggavue-index]");
    expect(items).toHaveLength(3);
    expect(items[0]?.textContent).toBe("0:a");
  });

  it.fails("follows a pointer drag under Vapor", async () => {
    const root = mountHarness();
    await nextFrames();

    const drag = root.querySelector<HTMLElement>('[data-harness="drag"]');
    if (drag === null) throw new Error("Draggable did not render");

    await dragBy(drag, 30, 15);
    expect(drag.style.transform).toBe("translate3d(30px, 15px, 0px)");
  });

  it.fails("speaks the keyboard grammar under Vapor", async () => {
    const root = mountHarness();
    await nextFrames();

    const drag = root.querySelector<HTMLElement>('[data-harness="drag"]');
    if (drag === null) throw new Error("Draggable did not render");

    fireKey(drag, " ");
    fireKey(drag, "ArrowRight");
    fireKey(drag, "ArrowDown");
    await nextFrames();
    fireKey(drag, "Enter");
    await nextFrames();

    expect(drag.style.transform).toBe("translate3d(10px, 10px, 0px)");
  });

  it.fails("reorders the sortable list under Vapor", async () => {
    const root = mountHarness();
    await nextFrames();

    const rows = [...root.querySelectorAll<HTMLElement>("[data-draggavue-index]")];
    for (const row of rows) row.style.height = "40px";
    const first = rows[0];
    if (first === undefined) throw new Error("sortable rows missing");

    await dragBy(first, 0, 45);
    const texts = [...root.querySelectorAll("[data-draggavue-index]")].map(
      (row) => row.textContent,
    );
    expect(texts).toEqual(["0:b", "1:a", "2:c"]);
  });
});
