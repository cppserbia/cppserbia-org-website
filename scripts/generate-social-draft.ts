import { fileURLToPath } from "url";
import path from "path";
import { defineCommand, runMain } from "citty";
import { loadEnvFile } from "./load-env";
import { readEventFile } from "./social/read-event";
import { extractSpeakerName, parseSocialText } from "./social/extract";
import { generateWithFallback } from "./social/llm";
import type { Provider } from "./social/llm";
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
  console.error("\nPrompt that would be sent to LLM:");
  console.error("─".repeat(60));
  console.error(prompt);
  console.error("─".repeat(60));
}

async function runGenerate(eventFile: string, mode: Mode, dryRun: boolean, provider: Provider) {
  const config = modes[mode];

  const eventResult = readEventFile(eventFile);
  if (!eventResult.ok) {
    console.error(eventResult.error);
    process.exit(1);
  }
  const { frontmatter, content, slug } = eventResult.value;

  const validationError = config.validate(frontmatter, eventFile);
  if (validationError) {
    console.error(validationError);
    process.exit(1);
  }

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

  console.error(`Generating ${mode} draft via LLM (provider: ${provider})...`);
  const draftResult = await generateWithFallback(provider, prompt);
  if (!draftResult.ok) {
    console.error(`LLM error (${draftResult.error.kind}): ${draftResult.error.message}`);
    process.exit(1);
  }
  const { en, sr } = parseSocialText(draftResult.value);
  if (!en || !sr) {
    console.error("Raw LLM output:\n" + draftResult.value);
    console.error("Failed to parse bilingual social text from LLM response.");
    process.exit(1);
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
    provider: {
      type: "string",
      default: "auto",
      description: "LLM provider: auto, gemini, or github",
    },
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Show extracted metadata and prompt without calling LLM API",
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

    const provider = args.provider as Provider;
    if (provider !== "auto" && provider !== "gemini" && provider !== "github") {
      throw new Error(
        `Invalid --provider value: ${args.provider}. Use "auto", "gemini", or "github".`
      );
    }

    await runGenerate(args.eventFile, mode, args["dry-run"], provider);
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  loadEnvFile();
  runMain(main).then(() => process.exit(0));
}
