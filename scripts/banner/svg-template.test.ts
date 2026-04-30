// @vitest-environment node
import { describe, expect, it } from "vitest";

import { __test, clearText, hasElement, loadSvg, setFontSize, setText } from "./svg-template";

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text id="title" style="font-size:24px;fill:black"><tspan style="font-size:24px">Old</tspan></text>
  <text id="bare" style="fill:red">Plain</text>
  <text id="no-style"><tspan>Inner</tspan></text>
  <rect id="hint" x="0" y="0" width="80" height="20"/>
</svg>`;

describe("setText", () => {
  it("updates the inner tspan when present", () => {
    const t = loadSvg(FIXTURE);
    expect(setText(t, "title", "Hello")).toBe(true);
    const out = t.serialize();
    expect(out).toContain(">Hello<");
    expect(out).not.toContain(">Old<");
  });

  it("falls back to element textContent when no tspan exists", () => {
    const t = loadSvg(FIXTURE);
    expect(setText(t, "bare", "New")).toBe(true);
    expect(t.serialize()).toContain(">New<");
  });

  it("returns false for unknown ids", () => {
    const t = loadSvg(FIXTURE);
    expect(setText(t, "nope", "x")).toBe(false);
  });
});

describe("setFontSize", () => {
  it("rewrites the font-size declaration in the style attribute", () => {
    const t = loadSvg(FIXTURE);
    expect(setFontSize(t, "title", 48)).toBe(true);
    const out = t.serialize();
    expect(out).toContain("font-size:48px");
    expect(out).not.toContain("font-size:24px");
  });

  it("appends font-size when the style attribute lacks one", () => {
    const t = loadSvg(FIXTURE);
    expect(setFontSize(t, "bare", 18)).toBe(true);
    const el = t.document.getElementById("bare");
    expect(el?.getAttribute("style")).toMatch(/font-size:18px/);
    expect(el?.getAttribute("style")).toContain("fill:red");
  });

  it("creates a style attribute when none exists", () => {
    const t = loadSvg(FIXTURE);
    expect(setFontSize(t, "no-style", 12)).toBe(true);
    const el = t.document.getElementById("no-style");
    expect(el?.getAttribute("style")).toBe("font-size:12px");
  });
});

describe("applyFontSizeToStyle (internal)", () => {
  const { applyFontSizeToStyle } = __test;

  it("replaces an existing font-size declaration", () => {
    expect(applyFontSizeToStyle("font-size:10px;fill:red", 22)).toBe("font-size:22px;fill:red");
  });

  it("appends when no font-size is present", () => {
    expect(applyFontSizeToStyle("fill:red", 22)).toBe("fill:red;font-size:22px");
  });

  it("handles trailing semicolons cleanly", () => {
    expect(applyFontSizeToStyle("fill:red;", 22)).toBe("fill:red;font-size:22px");
  });

  it("returns just the declaration for null/empty input", () => {
    expect(applyFontSizeToStyle(null, 22)).toBe("font-size:22px");
    expect(applyFontSizeToStyle("", 22)).toBe("font-size:22px");
    expect(applyFontSizeToStyle("   ", 22)).toBe("font-size:22px");
  });
});

describe("clearText / hasElement", () => {
  it("clearText empties the text", () => {
    const t = loadSvg(FIXTURE);
    expect(clearText(t, "title")).toBe(true);
    expect(t.serialize()).not.toContain(">Old<");
  });

  it("hasElement reports presence", () => {
    const t = loadSvg(FIXTURE);
    expect(hasElement(t, "title")).toBe(true);
    expect(hasElement(t, "missing")).toBe(false);
  });
});
