import { DOMParser } from "linkedom";

export interface SvgTemplate {
  document: ReturnType<DOMParser["parseFromString"]>;
  serialize(): string;
}

export function loadSvg(svgText: string): SvgTemplate {
  const document = new DOMParser().parseFromString(svgText, "image/svg+xml");
  return {
    document,
    serialize: () => document.toString(),
  };
}

/**
 * Update the visible text content of a `<text>` element identified by `id`.
 *
 * SVG text from Inkscape usually has a child `<tspan>` carrying the actual text
 * with its own style; we mirror Python's behaviour and update the tspan when
 * present, falling back to the element's own textContent.
 */
export function setText(template: SvgTemplate, id: string, value: string): boolean {
  const el = template.document.getElementById(id);
  if (!el) return false;
  const tspan = el.querySelector("tspan");
  if (tspan) {
    tspan.textContent = value;
  } else {
    el.textContent = value;
  }
  return true;
}

const FONT_SIZE_RE = /font-size\s*:\s*[^;]+/i;

function applyFontSizeToStyle(style: string | null, sizePx: number): string {
  const decl = `font-size:${sizePx}px`;
  if (!style) return decl;
  if (FONT_SIZE_RE.test(style)) {
    return style.replace(FONT_SIZE_RE, decl);
  }
  const trimmed = style.trim();
  if (trimmed === "") return decl;
  return trimmed.endsWith(";") ? `${trimmed}${decl}` : `${trimmed};${decl}`;
}

/**
 * Set the font size (px) on the text element and its first nested tspan, if any.
 *
 * Mirrors `set_font_size` in the Python script: it rewrites the `font-size`
 * declaration inside the `style` attribute of both the element and the tspan,
 * appending one if missing.
 */
export function setFontSize(template: SvgTemplate, id: string, sizePx: number): boolean {
  const el = template.document.getElementById(id);
  if (!el) return false;

  el.setAttribute("style", applyFontSizeToStyle(el.getAttribute("style"), sizePx));

  const tspan = el.querySelector("tspan");
  if (tspan) {
    tspan.setAttribute("style", applyFontSizeToStyle(tspan.getAttribute("style"), sizePx));
  }
  return true;
}

export function clearText(template: SvgTemplate, id: string): boolean {
  return setText(template, id, "");
}

export function hasElement(template: SvgTemplate, id: string): boolean {
  return template.document.getElementById(id) !== null;
}

// Exported only so the test file can exercise the style splicing without going
// through a full DOM parse.
export const __test = { applyFontSizeToStyle };
