import { afterEach, describe, expect, it } from "vitest";
import { resetLiveRegion } from "../testing/browser";
import { announce, ensureInstructionsElement } from "./announcer";

afterEach(() => {
  resetLiveRegion();
});

describe("announce", () => {
  it("creates a single assertive live region on demand", () => {
    announce("first");
    announce("second");
    const regions = document.querySelectorAll('[role="status"]');
    expect(regions).toHaveLength(1);
    expect(regions[0]?.getAttribute("aria-live")).toBe("assertive");
    expect(regions[0]?.getAttribute("aria-atomic")).toBe("true");
    expect(regions[0]?.textContent).toBe("second");
  });

  it("keeps the region visually hidden but rendered", () => {
    announce("hidden but audible");
    const region = document.querySelector<HTMLElement>('[role="status"]');
    expect(region?.style.width).toBe("1px");
    expect(region?.style.overflow).toBe("hidden");
    expect(region?.isConnected).toBe(true);
  });
});

describe("ensureInstructionsElement", () => {
  it("shares one node per unique text", () => {
    const a = ensureInstructionsElement("shared text");
    const b = ensureInstructionsElement("shared text");
    const c = ensureInstructionsElement("different text");
    expect(a).toBe(b);
    expect(c).not.toBe(a);
    expect(document.getElementById(a)?.textContent).toBe("shared text");
    expect(document.getElementById(c)?.textContent).toBe("different text");
  });
});
