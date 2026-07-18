import type { ComputedRef } from "vue";
import { computed, onMounted, shallowRef } from "vue";
import { announce, ensureInstructionsElement } from "../a11y/announcer";
import type { KeyboardSteps } from "../a11y/keyboard";
import { DEFAULT_STEPS, intentFromKey } from "../a11y/keyboard";
import type { DragA11yMessages } from "../a11y/messages";
import { DEFAULT_MESSAGES } from "../a11y/messages";
import { translate } from "../shared/geometry";
import type { DragState, DragTransition } from "./drag";

// --- Types & Signatures ---

export type DragA11yOptions = {
  /**
   * Override or disable assistive-technology messages. A partial
   * object merges over {@link DEFAULT_MESSAGES}, so localizing just
   * one string is fine; `false` silences announcements entirely.
   *
   * @default DEFAULT_MESSAGES
   * @example
   * ```ts
   * useDraggable(box, {
   *   a11y: { grabbed: (p) => `つかみました (${p.x}, ${p.y})` },
   * });
   * ```
   */
  a11y?: Partial<DragA11yMessages> | false | undefined;
  /**
   * Tune arrow-key steps, or `false` to opt out of keyboard
   * dragging — which also removes the `role` / `tabindex`
   * affordances so the element stops advertising an interaction it
   * would not honor.
   *
   * @default { step: px(10), fineStep: px(1) }
   */
  keyboard?: boolean | Partial<KeyboardSteps> | undefined;
};

/** Spread onto the handle element (`v-bind="attrs"`). */
export type DraggableAttrs = {
  /**
   * Constant marker for styling and the opt-in stylesheets —
   * present on every handle, dragging or not.
   */
  readonly "data-draggavue": "";
  readonly role?: "button";
  readonly tabindex?: 0;
  readonly "aria-roledescription"?: string;
  readonly "aria-describedby"?: string;
  readonly "data-dragging"?: "true";
};

export type DragA11yHost = {
  readonly getState: () => DragState;
  readonly isDisabled: () => boolean;
  /** Snapshot constraints and grab at the current settled position. */
  readonly grab: () => void;
  readonly moveBy: (dx: number, dy: number) => void;
  readonly drop: () => void;
  readonly cancel: () => void;
};

export type DragA11y = {
  readonly attrs: ComputedRef<DraggableAttrs>;
  /** Feed every applied transition through here for announcements. */
  readonly announceTransition: (transition: DragTransition) => void;
  readonly onKeydown: (event: KeyboardEvent) => void;
  readonly onFocusout: () => void;
};

// --- Implementation ---

const isKeyboardGrab = (state: DragState): boolean =>
  state.status === "dragging" && state.source === "keyboard";

/**
 * Accessibility wiring for a drag interaction: WAI-ARIA attributes,
 * the keyboard grammar, and live-region announcements. Must be
 * called during `setup()`.
 */
export function useDragA11y(host: DragA11yHost, options: DragA11yOptions): DragA11y {
  const messages: DragA11yMessages | null =
    options.a11y === false ? null : { ...DEFAULT_MESSAGES, ...options.a11y };
  const steps: KeyboardSteps | null =
    options.keyboard === false
      ? null
      : { ...DEFAULT_STEPS, ...(options.keyboard === true ? undefined : options.keyboard) };

  const instructionsId = shallowRef<string | null>(null);
  onMounted(() => {
    if (messages !== null && steps !== null) {
      instructionsId.value = ensureInstructionsElement(messages.instructions);
    }
  });

  const attrs = computed<DraggableAttrs>(() => {
    // `getState` reads the host's reactive state, so this computed
    // re-evaluates as sessions start and settle.
    const base: DraggableAttrs = {
      "data-draggavue": "",
      ...(host.getState().status === "dragging" ? { "data-dragging": "true" as const } : {}),
    };
    if (steps === null) return base;

    return {
      ...base,
      role: "button",
      tabindex: 0,
      "aria-roledescription": (messages ?? DEFAULT_MESSAGES).roleDescription,
      ...(instructionsId.value === null ? {} : { "aria-describedby": instructionsId.value }),
    };
  });

  function announceTransition(transition: DragTransition): void {
    if (messages === null) return;
    switch (transition.effect) {
      case "none":
        return;
      case "started":
        announce(messages.grabbed(translate(transition.session.origin, transition.session.delta)));
        return;
      case "moved":
        // Pointer moves fire per frame — only keyboard moves are
        // meaningful (and bearable) to hear.
        if (transition.session.source === "keyboard") {
          announce(messages.moved(translate(transition.session.origin, transition.session.delta)));
        }
        return;
      case "committed":
        announce(messages.dropped(transition.position));
        return;
      case "canceled":
        announce(messages.canceled(transition.position));
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (steps === null || host.isDisabled()) return;
    const grabbed = isKeyboardGrab(host.getState());
    const intent = intentFromKey(event.key, event.shiftKey, grabbed, steps);
    if (intent.kind === "none") return;
    // Tab cancels but must keep moving focus naturally.
    if (event.key !== "Tab") event.preventDefault();
    switch (intent.kind) {
      case "grab":
        host.grab();
        return;
      case "drop":
        host.drop();
        return;
      case "move":
        host.moveBy(intent.delta.dx, intent.delta.dy);
        return;
      case "cancel":
        host.cancel();
    }
  }

  function onFocusout(): void {
    if (isKeyboardGrab(host.getState())) host.cancel();
  }

  return { attrs, announceTransition, onKeydown, onFocusout };
}
