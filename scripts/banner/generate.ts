import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { exportPng, queryWidth } from "./inkscape";
import { hasElement, loadSvg, setFontSize, setText, type SvgTemplate } from "./svg-template";
import { ensureTemplatesCache } from "./template-cache";
import { fitFontSize } from "./text-fit";

export type BannerFormat = "horizontal" | "vertical_3_4" | "vertical_9_16";

export interface BannerInput {
  /** Full speaker name. Split into first/last on the last whitespace for vertical templates. */
  speaker: string;
  /** Pre-formatted date text shown in the date field. */
  dateText: string;
  /** Title broken into lines. Up to 3 (horizontal) or 5 (vertical). Excess is truncated. */
  titleLines: string[];
  /**
   * Optional URL that replaces the fixed placeholder avatar.png in every
   * template. The image is downloaded once per format invocation and the
   * SVG's `xlink:href="avatar.png"` reference is rewritten to point at the
   * local copy. Populated by `upload-speaker-avatar.ts` via the
   * `speaker_avatar` frontmatter field.
   */
  speakerAvatarUrl?: string;
}

export interface FormatSpec {
  templateFile: string;
  width: number;
  height: number;
  maxTitleLines: number;
}

export const FORMAT_SPECS: Record<BannerFormat, FormatSpec> = {
  horizontal: {
    templateFile: "talk_banner_horizontal.svg",
    width: 1920,
    height: 1080,
    maxTitleLines: 3,
  },
  vertical_3_4: {
    templateFile: "talk_banner_vertical_3_4.svg",
    width: 1440,
    height: 1920,
    maxTitleLines: 5,
  },
  vertical_9_16: {
    templateFile: "talk_banner_vertical_9_16.svg",
    width: 1080,
    height: 1920,
    maxTitleLines: 5,
  },
};

/**
 * Resolve relative `xlink:href` paths in the SVG to absolute paths under
 * `baseDir`, so the work-copy SVG can live in a different directory while
 * still finding `avatar.png` and the shared raster asset(s).
 *
 * `overrides` lets the caller swap a specific relative href for an absolute
 * path before the templates-dir resolution kicks in — used to override the
 * fixed `avatar.png` placeholder with a per-event speaker portrait.
 */
function rewriteHrefsToAbsolute(
  svgText: string,
  baseDir: string,
  overrides: Record<string, string> = {}
): string {
  return svgText.replace(/xlink:href="([^"]+)"/g, (match, href: string) => {
    if (Object.prototype.hasOwnProperty.call(overrides, href)) {
      return `xlink:href="${overrides[href]}"`;
    }
    if (
      href.startsWith("#") ||
      href.startsWith("data:") ||
      href.startsWith("/") ||
      /^[a-z]+:/i.test(href)
    ) {
      return match;
    }
    return `xlink:href="${path.resolve(baseDir, href)}"`;
  });
}

async function downloadAvatarToFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url, {
    headers: { "User-Agent": "cppserbia-banner-generator" },
  });
  if (!response.ok) {
    throw new Error(`Failed to download speaker avatar from ${url}: HTTP ${response.status}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

/**
 * Split a speaker name into first / last name on the last whitespace boundary.
 * `"Ivan Čukić"` → `["Ivan", "Čukić"]`. Single-word names: `["Madonna", ""]`.
 */
export function splitSpeakerName(speaker: string): { firstName: string; surname: string } {
  const trimmed = speaker.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) return { firstName: trimmed, surname: "" };
  return {
    firstName: trimmed.slice(0, lastSpace).trim(),
    surname: trimmed.slice(lastSpace + 1).trim(),
  };
}

// Asserts the mutation succeeded. If a template's element id ever changes
// (or a future template doesn't carry it), this surfaces a clear error
// pointing at the exact missing id and template file, instead of producing
// a silently-mis-rendered banner.
function requireSetText(
  template: SvgTemplate,
  templateFile: string,
  id: string,
  value: string
): void {
  if (!setText(template, id, value)) {
    throw new Error(
      `Template "${templateFile}" is missing required element id="${id}" (setText). ` +
        `Templates may be out of sync with the manifest in scripts/banner/templates.manifest.json.`
    );
  }
}

function requireSetFontSize(
  template: SvgTemplate,
  templateFile: string,
  id: string,
  sizePx: number
): void {
  if (!setFontSize(template, id, sizePx)) {
    throw new Error(
      `Template "${templateFile}" is missing required element id="${id}" (setFontSize). ` +
        `Templates may be out of sync with the manifest in scripts/banner/templates.manifest.json.`
    );
  }
}

async function fitFieldFontSize(
  template: SvgTemplate,
  templateFile: string,
  workSvgPath: string,
  fieldId: string,
  hintWidth: number
): Promise<number> {
  return fitFontSize(async (sizePx) => {
    requireSetFontSize(template, templateFile, fieldId, sizePx);
    await fs.writeFile(workSvgPath, template.serialize());
    return queryWidth(workSvgPath, fieldId);
  }, hintWidth);
}

export interface GenerateOptions {
  outDir: string;
  format: BannerFormat;
  input: BannerInput;
  /** File-name stem for outputs, e.g. "2026-04-29-Cpp-Serbia-Founding-Celebration". */
  outBaseName: string;
  /** Defaults to 85. */
  jpegQuality?: number;
  /** Keep the intermediate SVG + PNG files instead of cleaning them up. Default false. */
  keepIntermediates?: boolean;
}

export interface GenerateResult {
  jpgPath: string;
  pngPath: string;
}

export async function generateBanner(opts: GenerateOptions): Promise<GenerateResult> {
  const spec = FORMAT_SPECS[opts.format];
  const templateFile = spec.templateFile;
  const templatesDir = await ensureTemplatesCache();
  const templatePath = path.join(templatesDir, templateFile);

  await fs.mkdir(opts.outDir, { recursive: true });

  // If a speaker avatar URL is provided, download it once per format and
  // override the SVG's `avatar.png` href to point at the local copy.
  let avatarOverridePath: string | undefined;
  if (opts.input.speakerAvatarUrl) {
    avatarOverridePath = path.join(opts.outDir, `${opts.outBaseName}-${opts.format}.avatar`);
    await downloadAvatarToFile(opts.input.speakerAvatarUrl, avatarOverridePath);
  }

  let svgText = await fs.readFile(templatePath, "utf8");
  svgText = rewriteHrefsToAbsolute(
    svgText,
    templatesDir,
    avatarOverridePath ? { "avatar.png": avatarOverridePath } : {}
  );

  const template = loadSvg(svgText);

  requireSetText(template, templateFile, "text_field_date", opts.input.dateText);

  const useSingleAuthorField = hasElement(template, "text_field_author");
  let surname = "";
  if (useSingleAuthorField) {
    requireSetText(template, templateFile, "text_field_author", opts.input.speaker);
  } else {
    const split = splitSpeakerName(opts.input.speaker);
    surname = split.surname;
    requireSetText(template, templateFile, "text_field_author_1", split.firstName);
    requireSetText(template, templateFile, "text_field_author_2", split.surname);
  }

  const titleLines = opts.input.titleLines.slice(0, spec.maxTitleLines);
  for (let i = 1; i <= spec.maxTitleLines; i++) {
    requireSetText(template, templateFile, `text_field_${i}`, titleLines[i - 1] ?? "");
  }

  // Work-copy SVG keeps the format suffix to avoid collisions when generating
  // multiple formats with the same output base name.
  const workSvgPath = path.join(opts.outDir, `${opts.outBaseName}-${opts.format}.work.svg`);
  await fs.writeFile(workSvgPath, template.serialize());

  if (useSingleAuthorField) {
    const hintW = await queryWidth(workSvgPath, "text_field_author_hint");
    const sizeStar = await fitFieldFontSize(
      template,
      templateFile,
      workSvgPath,
      "text_field_author",
      hintW
    );
    requireSetFontSize(template, templateFile, "text_field_author", sizeStar);
  } else {
    const sizes: number[] = [];
    const hint1 = await queryWidth(workSvgPath, "text_field_author_1_hint");
    sizes.push(
      await fitFieldFontSize(template, templateFile, workSvgPath, "text_field_author_1", hint1)
    );
    if (surname !== "") {
      const hint2 = await queryWidth(workSvgPath, "text_field_author_2_hint");
      sizes.push(
        await fitFieldFontSize(template, templateFile, workSvgPath, "text_field_author_2", hint2)
      );
    }
    const minSize = Math.min(...sizes);
    requireSetFontSize(template, templateFile, "text_field_author_1", minSize);
    if (surname !== "") {
      requireSetFontSize(template, templateFile, "text_field_author_2", minSize);
    }
  }

  if (titleLines.length > 0) {
    const sizes: number[] = [];
    for (let i = 1; i <= titleLines.length; i++) {
      const fieldId = `text_field_${i}`;
      const hintW = await queryWidth(workSvgPath, `${fieldId}_hint`);
      sizes.push(await fitFieldFontSize(template, templateFile, workSvgPath, fieldId, hintW));
    }
    const minSize = Math.min(...sizes);
    for (let i = 1; i <= titleLines.length; i++) {
      requireSetFontSize(template, templateFile, `text_field_${i}`, minSize);
    }
  }

  await fs.writeFile(workSvgPath, template.serialize());

  const pngPath = path.join(opts.outDir, `${opts.outBaseName}.png`);
  await exportPng(workSvgPath, "talk_announcement_background", pngPath, spec.width, spec.height);

  const jpgPath = path.join(opts.outDir, `${opts.outBaseName}.jpg`);
  await sharp(pngPath)
    .jpeg({ quality: opts.jpegQuality ?? 85, progressive: true, mozjpeg: true })
    .toFile(jpgPath);

  if (!opts.keepIntermediates) {
    await fs.rm(workSvgPath, { force: true });
    await fs.rm(pngPath, { force: true });
    if (avatarOverridePath) {
      await fs.rm(avatarOverridePath, { force: true });
    }
  }

  return { jpgPath, pngPath };
}
