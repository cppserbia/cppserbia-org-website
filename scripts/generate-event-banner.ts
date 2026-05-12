import { defineCommand, runMain } from "citty";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { fileURLToPath } from "url";

import { type BannerFormat, generateBanner } from "./banner/generate";
import { extractSpeakerName } from "./social/extract";
import type { EventFrontmatter } from "./types";

const FORMATS: BannerFormat[] = ["horizontal", "vertical_3_4", "vertical_9_16"];

// "Wednesday, 29. 4. 2026." — matches the original Python pipeline's date style.
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatBannerDate(date: Date): string {
  const day = DAY_NAMES[date.getUTCDay()];
  const d = date.getUTCDate();
  const m = date.getUTCMonth() + 1;
  const y = date.getUTCFullYear();
  return `${day}, ${d}. ${m}. ${y}.`;
}

interface SplitOptions {
  targetChars: number;
  maxLines: number;
}

export function splitTitleLines(title: string, opts: SplitOptions): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current === "") {
      current = word;
    } else if (current.length + 1 + word.length <= opts.targetChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  // Collapse overflow into the last line — binary-search font fitting will
  // shrink whatever we end up with.
  while (lines.length > opts.maxLines) {
    const tail = lines.pop()!;
    lines[lines.length - 1] += " " + tail;
  }
  return lines;
}

const FORMAT_TARGETS: Record<BannerFormat, SplitOptions> = {
  horizontal: { targetChars: 28, maxLines: 3 },
  vertical_3_4: { targetChars: 18, maxLines: 5 },
  vertical_9_16: { targetChars: 18, maxLines: 5 },
};

const FORMAT_BASENAME_SUFFIX: Record<BannerFormat, string> = {
  horizontal: "",
  vertical_3_4: "-3-4",
  vertical_9_16: "-9-16",
};

export function resolveSpeakerForBanner(
  frontmatter: EventFrontmatter & { banner_author?: string },
  content: string,
  fallback = "C++ Serbia"
): string {
  if (typeof frontmatter.banner_author === "string" && frontmatter.banner_author.trim() !== "") {
    return frontmatter.banner_author.trim();
  }
  const fromBody = extractSpeakerName(content);
  if (fromBody) return fromBody;
  return fallback;
}

interface RunGenerateOptions {
  eventFile: string;
  outDir: string;
  formats?: BannerFormat[];
}

export async function runGenerate(opts: RunGenerateOptions): Promise<string[]> {
  const { eventFile } = opts;
  const formats = opts.formats ?? FORMATS;

  if (!fs.existsSync(eventFile)) {
    throw new Error(`Event file not found: ${eventFile}`);
  }

  const raw = fs.readFileSync(eventFile, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as EventFrontmatter & {
    banner_author?: string;
    speaker_avatar?: string;
  };

  if (!frontmatter.title) throw new Error("Event is missing frontmatter `title`.");
  if (!(frontmatter.date instanceof Date) || Number.isNaN(frontmatter.date.getTime())) {
    throw new Error("Event frontmatter `date` is missing or not a valid date.");
  }

  const speaker = resolveSpeakerForBanner(frontmatter, content);
  const dateText = formatBannerDate(frontmatter.date);
  const slug = path.basename(eventFile, ".md");
  const speakerAvatarUrl =
    typeof frontmatter.speaker_avatar === "string" && frontmatter.speaker_avatar.trim() !== ""
      ? frontmatter.speaker_avatar.trim()
      : undefined;

  console.error(`Generating banners for: ${frontmatter.title}`);
  console.error(`  speaker: ${speaker}`);
  console.error(`  date:    ${dateText}`);
  console.error(`  outDir:  ${opts.outDir}`);
  if (speakerAvatarUrl) {
    console.error(`  avatar:  ${speakerAvatarUrl}`);
  }

  const generated: string[] = [];
  for (const format of formats) {
    const target = FORMAT_TARGETS[format];
    const titleLines = splitTitleLines(frontmatter.title, target);
    const outBaseName = slug + FORMAT_BASENAME_SUFFIX[format];
    console.error(`\n[${format}] outBase=${outBaseName} lines=${JSON.stringify(titleLines)}`);
    const { jpgPath } = await generateBanner({
      outDir: opts.outDir,
      format,
      input: { speaker, dateText, titleLines, speakerAvatarUrl },
      outBaseName,
    });
    console.error(`  → ${jpgPath}`);
    generated.push(jpgPath);
  }

  console.error(`\nDone. Generated ${generated.length} banner(s).`);
  return generated;
}

const main = defineCommand({
  meta: {
    name: "generate-event-banner",
    description: "Generate horizontal + 3:4 + 9:16 event banners for a single event markdown file.",
  },
  args: {
    out: {
      type: "string",
      default: "images/events",
      description: "Output directory for generated banners.",
    },
    eventFile: {
      type: "positional",
      required: true,
      description: "Path to the event markdown file (events/YYYY-MM-DD-Title.md).",
    },
  },
  async run({ args }) {
    await runGenerate({ eventFile: args.eventFile, outDir: args.out });
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runMain(main).then(() => process.exit(0));
}
