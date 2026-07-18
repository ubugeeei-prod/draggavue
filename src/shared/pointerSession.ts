import type { Position } from "./geometry";
import { pointFromEvent } from "./dom";

// --- Types & Signatures ---

export type PointerSessionHandlers = {
  /** Called at most once per animation frame with the latest point. */
  readonly onMove: (point: Position, pointerId: number) => void;
  /** Pending moves are flushed synchronously before this fires. */
  readonly onUp: (pointerId: number) => void;
  /** Escape, pointercancel, or window blur. */
  readonly onCancel: () => void;
};

export type PointerSession = {
  readonly begin: () => void;
  readonly end: () => void;
};

export type createPointerSession = (handlers: PointerSessionHandlers) => PointerSession;

// --- Implementation ---

/**
 * Window-level pointer tracking for one drag session at a time.
 *
 * Listeners exist only between `begin()` and `end()`, all behind a
 * single AbortController. Moves are coalesced to one callback per
 * frame regardless of the browser's pointermove cadence, and the
 * final pre-release move is flushed synchronously so the committed
 * position is exact.
 */
export const createPointerSession: createPointerSession = (handlers) => {
  let controller: AbortController | null = null;
  let frame: number | null = null;
  let latestPoint: Position | null = null;
  let latestPointerId = -1;

  const stopFrame = (): void => {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  };

  const flushMove = (): void => {
    frame = null;
    if (latestPoint === null) return;
    handlers.onMove(latestPoint, latestPointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    latestPoint = pointFromEvent(event);
    latestPointerId = event.pointerId;
    frame ??= requestAnimationFrame(flushMove);
  };

  const onPointerUp = (event: PointerEvent): void => {
    stopFrame();
    flushMove();
    handlers.onUp(event.pointerId);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    handlers.onCancel();
  };

  const onWindowCancel = (): void => {
    handlers.onCancel();
  };

  const end = (): void => {
    controller?.abort();
    controller = null;
    stopFrame();
    latestPoint = null;
  };

  const begin = (): void => {
    end();
    controller = new AbortController();
    const { signal } = controller;
    window.addEventListener("pointermove", onPointerMove, { signal, passive: true });
    window.addEventListener("pointerup", onPointerUp, { signal });
    window.addEventListener("pointercancel", onWindowCancel, { signal });
    window.addEventListener("blur", onWindowCancel, { signal });
    window.addEventListener("keydown", onKeydown, { signal });
  };

  return { begin, end };
};
