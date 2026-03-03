import { fileURLToPath } from "url";
import path from "path";
import { defineCommand, runMain } from "citty";
import { loadEnvFile } from "./load-env";
import { readEventFile } from "./social/read-event";
import { extractSpeakerName, parseSocialText } from "./social/extract";
import { generateSocialDraft } from "./social/gemini";
import { modes } from "./social/modes";
import type { Mode } from "./social/types";

function printDryRun(
  mode: Mode,
  fields: Array<[string, string]>,
  speakerName: string | null,
  description: string,
  prompt: string
) {
  console.error(`\n--- DRY RUN [${mode}] (no API call) ---\n`);
  console.error("Extracted metadata:");
  for (const [label, value] of fields) {
    console.error(`  ${label.padEnd(12)} ${value}`);
  }
  console.error(`  Speaker:     ${speakerName || "(not found)"}`);
  console.error(`  Description: ${description || "(none)"}`);
  console.error("\nPrompt that would be sent to Gemini:");
  console.error("─".repeat(60));
  console.error(prompt);
  console.error("─".repeat(60));
}

async function runGenerate(eventFile: string, mode: Mode, dryRun: boolean) {
  const config = modes[mode];
  const { frontmatter, content, slug } = readEventFile(eventFile);

  config.validate(frontmatter, eventFile);

  console.error(`Processing (${mode}): ${frontmatter.title}`);
  config.logExtra(frontmatter);

  const speakerName = extractSpeakerName(content);
  const description = config.extractDescription(content, frontmatter.description);

  if (speakerName) {
    console.error(`Speaker: ${speakerName}`);
  }

  const prompt = config.buildPrompt(frontmatter.title, description, speakerName);

  if (dryRun) {
    const fields: Array<[string, string]> = [
      ["Title:", frontmatter.title],
      ...config.dryRunFields(frontmatter),
      ["Image:", frontmatter.imageUrl || "(none)"],
    ];
    printDryRun(mode, fields, speakerName, description, prompt);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  console.error(`Generating ${mode} draft via Gemini...`);
  const draft = await generateSocialDraft(apiKey, prompt);
  const { en, sr } = parseSocialText(draft);
  if (!en || !sr) {
    console.error("Raw Gemini output:\n" + draft);
    throw new Error("Failed to parse bilingual social text from Gemini response.");
  }
  const payload = config.buildPayload(frontmatter, slug, en, sr);
  console.log(JSON.stringify(payload, null, 2));
}

const main = defineCommand({
  meta: {
    name: "generate-social-draft",
    description: "Generate bilingual social media drafts for C++ Serbia events",
  },
  args: {
    type: { type: "string", required: true, description: "Mode: recording or announcement" },
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Show extracted metadata and prompt without calling Gemini API",
    },
    eventFile: {
      type: "positional",
      required: true,
      description: "Path to the event markdown file",
    },
  },
  async run({ args }) {
    const mode = args.type as Mode;
    if (mode !== "recording" && mode !== "announcement") {
      throw new Error(`Invalid --type value: ${args.type}. Use "recording" or "announcement".`);
    }

    await runGenerate(args.eventFile, mode, args["dry-run"]);
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  loadEnvFile();
  runMain(main);
}
