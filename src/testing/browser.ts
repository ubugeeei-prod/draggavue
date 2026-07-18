import type { App, Component } from "vue";
import { createApp } from "vue";
import type { Position } from "../shared/geometry";
import { px } from "../shared/units";

// Small, dependency-free harness for browser-mode tests. Lives under
// `src/testing` (excluded from the published build).

export type Mounted = {
  readonly container: HTMLElement;
  readonly app: App;
  unmount(): void;
};

const active: Mounted[] = [];

export function mountComponent(component: Component, props?: Record<string, unknown>): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const app = createApp(component, props);
  app.mount(container);
  const mounted: Mounted = {
    container,
    app,
    unmount() {
      app.unmount();
      container.remove();
      const index = active.indexOf(mounted);
      if (index !== -1) active.splice(index, 1);
    },
  };
  active.push(mounted);
  return mounted;
}

/** Call from `afterEach` — tears down anything a failed test left behind. */
export function unmountAll(): void {
  // unmount() splices itself out of `active`, so drain from the front.
  while (active.length > 0) active[0]?.unmount();
}

export function centerOf(element: Element): Position {
  const rect = element.getBoundingClientRect();
  return {
    x: px(rect.left + rect.width / 2),
    y: px(rect.top + rect.height / 2),
  };
}

/** Two frames: one for the rAF-coalesced move, one for Vue's patch. */
export function nextFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (remaining: number): void => {
      if (remaining <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(remaining - 1));
    };
    step(count);
  });
}

type PointerInit = {
  readonly x: number;
  readonly y: number;
  readonly pointerId?: number;
  readonly pointerType?: string;
  readonly button?: number;
};

export function firePointer(
  target: EventTarget,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  init: PointerInit,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      pointerId: init.pointerId ?? 1,
      pointerType: init.pointerType ?? "mouse",
      button: init.button ?? 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX: init.x,
      clientY: init.y,
    }),
  );
}

export function fireKey(target: EventTarget, key: string, shiftKey = false): void {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }),
  );
}

/** Full pointer drag: down on `element`, move by (dx, dy), release. */
export async function dragBy(element: Element, dx: number, dy: number): Promise<void> {
  const start = centerOf(element);
  firePointer(element, "pointerdown", { x: start.x, y: start.y });
  firePointer(window, "pointermove", { x: start.x + dx / 2, y: start.y + dy / 2 });
  await nextFrames();
  firePointer(window, "pointermove", { x: start.x + dx, y: start.y + dy });
  await nextFrames();
  firePointer(window, "pointerup", { x: start.x + dx, y: start.y + dy });
  await nextFrames();
}

export function liveRegionText(): string {
  return document.querySelector('[role="status"]')?.textContent ?? "";
}

/** The live region is app-global — clear it between tests. */
export function resetLiveRegion(): void {
  const region = document.querySelector('[role="status"]');
  if (region !== null) region.textContent = "";
}
