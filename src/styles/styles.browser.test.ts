import { describe, expect, it, onTestFinished } from "vitest";
import "./core.css";
import "./lift.css";

type ProbeOptions = {
  /** Freeze transitions so computed values are final, not mid-tween. */
  readonly frozen?: boolean;
  readonly marker?: "data-draggavue" | "data-draggavue-index";
};

function mountProbe({ frozen = false, marker = "data-draggavue" }: ProbeOptions = {}): HTMLElement {
  const probe = document.createElement("div");
  probe.setAttribute(marker, marker === "data-draggavue" ? "" : "0");
  if (frozen) probe.style.transition = "none";
  document.body.appendChild(probe);

  onTestFinished(() => {
    probe.remove();
  });
  return probe;
}

describe("core.css", () => {
  it("speaks the grab cursor language", () => {
    const probe = mountProbe();
    expect(getComputedStyle(probe).cursor).toBe("grab");

    probe.setAttribute("data-dragging", "true");
    expect(getComputedStyle(probe).cursor).toBe("grabbing");
  });

  it("targets sortable items through the index marker too", () => {
    const item = mountProbe({ marker: "data-draggavue-index" });
    expect(getComputedStyle(item).cursor).toBe("grab");
  });
});

describe("lift.css", () => {
  it("floats the dragged element with the individual scale property", () => {
    const probe = mountProbe({ frozen: true });
    expect(getComputedStyle(probe).scale).toBe("none");

    probe.setAttribute("data-dragging", "true");
    const style = getComputedStyle(probe);
    expect(style.scale).toBe("1.02");
    expect(style.boxShadow).not.toBe("none");
  });

  it("arms the spring settle only while not dragging", () => {
    const probe = mountProbe();
    expect(getComputedStyle(probe).transitionProperty).toContain("transform");
    expect(getComputedStyle(probe).transitionTimingFunction).toContain("linear(");

    probe.setAttribute("data-dragging", "true");
    expect(getComputedStyle(probe).transitionProperty).not.toContain("transform");
  });

  it("keeps custom properties overridable", () => {
    const probe = mountProbe({ frozen: true });
    probe.style.setProperty("--dv-lift-scale", "1.1");
    probe.setAttribute("data-dragging", "true");

    expect(getComputedStyle(probe).scale).toBe("1.1");
  });
});
