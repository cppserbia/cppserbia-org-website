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

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function runGenerate(eventFile: string, mode: Mode, dryRun: boolean) {
  const config = modes[mode];
  const { frontmatter, content } = readEventFile(eventFile);

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
  console.log(draft);
}

function runMetadata(eventFile: string, mode: Mode) {
  const config = modes[mode];
  const { frontmatter, slug } = readEventFile(eventFile);

  const metadata = config.buildMetadata(frontmatter, slug);
  console.log(JSON.stringify(metadata));
}

async function runBuildPayload(eventFile: string, mode: Mode) {
  const config = modes[mode];
  const { frontmatter, slug } = readEventFile(eventFile);

  const socialText = await readStdin();
  const { en, sr } = parseSocialText(socialText);

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
    "build-payload": {
      type: "boolean",
      default: false,
      description: "Read social text from stdin and output JSON payload",
    },
    metadata: {
      type: "boolean",
      default: false,
      description: "Output event metadata JSON (no Gemini call, no stdin)",
    },
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

    if (args["build-payload"] && args.metadata) {
      throw new Error("Cannot use --build-payload and --metadata together.");
    }

    if (args.metadata) {
      runMetadata(args.eventFile, mode);
    } else if (args["build-payload"]) {
      await runBuildPayload(args.eventFile, mode);
    } else {
      await runGenerate(args.eventFile, mode, args["dry-run"]);
    }
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  loadEnvFile();
  runMain(main);
}
