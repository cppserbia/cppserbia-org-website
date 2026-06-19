import { isEventAlreadyCreated, stripLeadingHeading } from "@coopkit/meetup";
import { defineCommand, runMain } from "citty";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { fileURLToPath } from "url";

import type { EventFrontmatter } from "./types";

/**
 * Thin glue between this repo's `events/*.md` source-of-truth and the published
 * `cppserbia/coopkit-meetup-action` composite action. Contains NO Meetup API,
 * OAuth, or GraphQL code — that all lives in `@coopkit/meetup`. Two jobs:
 *
 *   inputs <file>     — map frontmatter -> action inputs (GITHUB_OUTPUT)
 *   writeback <file>  — persist the action's event_url/event_id back to the file
 *
 * The action's `create-from-json` is not idempotent and never writes back, so
 * those two repo-specific concerns stay here.
 */

export interface ActionInputs {
  title: string;
  /** Canonical UTC ISO string (matches @coopkit/meetup's naiveIsoString slice). */
  date: string;
  duration: string;
  "venue-key": string;
  description: string;
  "image-url": string;
  /** "true" when the file already has a numeric event_id — skip creation. */
  "already-created": string;
}

type Frontmatter = EventFrontmatter & { duration?: string };

/**
 * Build the composite-action inputs from a parsed event file. Validates the
 * same required fields the old in-repo `buildCreateEventPayload` did, so a
 * malformed event fails fast instead of producing a broken draft.
 */
export function buildActionInputs(frontmatter: Frontmatter, body: string): ActionInputs {
  if (!frontmatter.title) {
    throw new Error("Event is missing frontmatter `title`.");
  }
  const date = new Date(frontmatter.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Event frontmatter `date` is missing or not a valid date.");
  }
  if (!frontmatter.venues || frontmatter.venues.length === 0 || !frontmatter.venues[0]) {
    throw new Error("Event is missing frontmatter `venues`.");
  }
  if (!frontmatter.duration) {
    throw new Error("Event is missing frontmatter `duration`.");
  }

  return {
    title: frontmatter.title,
    date: date.toISOString(),
    duration: frontmatter.duration,
    "venue-key": frontmatter.venues[0],
    description: stripLeadingHeading(body),
    "image-url": frontmatter.imageUrl ?? "",
    "already-created": isEventAlreadyCreated(frontmatter.event_id) ? "true" : "false",
  };
}

/**
 * Append key/value pairs to `$GITHUB_OUTPUT` (heredoc form for multiline
 * values). When not running under Actions, prints the pairs to stdout so the
 * script can be inspected locally.
 */
function emitOutputs(outputs: Record<string, string>): void {
  const outPath = process.env.GITHUB_OUTPUT;
  if (!outPath) {
    for (const [key, value] of Object.entries(outputs)) {
      process.stdout.write(`${key}=${value}\n`);
    }
    return;
  }

  let block = "";
  for (const [key, value] of Object.entries(outputs)) {
    if (value.includes("\n")) {
      const delimiter = `__COOPKIT_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}__`;
      block += `${key}<<${delimiter}\n${value}\n${delimiter}\n`;
    } else {
      block += `${key}=${value}\n`;
    }
  }
  fs.appendFileSync(outPath, block);
}

function readEvent(eventFile: string): { frontmatter: Frontmatter; body: string; raw: string } {
  if (!fs.existsSync(eventFile)) {
    throw new Error(`Event file not found: ${eventFile}`);
  }
  const raw = fs.readFileSync(eventFile, "utf8");
  const parsed = matter(raw);
  return { frontmatter: parsed.data as Frontmatter, body: parsed.content, raw };
}

const inputsCmd = defineCommand({
  meta: {
    name: "inputs",
    description: "Map an event markdown file's frontmatter to coopkit-meetup-action inputs.",
  },
  args: {
    eventFile: {
      type: "positional",
      required: true,
      description: "Path to the event markdown file (e.g. events/YYYY-MM-DD-Title.md).",
    },
  },
  run({ args }) {
    const { frontmatter, body } = readEvent(args.eventFile);
    const inputs = buildActionInputs(frontmatter, body);
    emitOutputs(inputs as unknown as Record<string, string>);
    console.error(
      `[inputs] ${args.eventFile} -> venue-key=${JSON.stringify(inputs["venue-key"])} ` +
        `date=${inputs.date} already-created=${inputs["already-created"]}`
    );
  },
});

const writebackCmd = defineCommand({
  meta: {
    name: "writeback",
    description: "Write the created draft's event_url + event_id back into the event frontmatter.",
  },
  args: {
    eventFile: {
      type: "positional",
      required: true,
      description: "Path to the event markdown file.",
    },
    url: { type: "string", required: true, description: "Meetup event URL (action output)." },
    id: { type: "string", required: true, description: "Meetup event ID (action output)." },
  },
  run({ args }) {
    if (!args.url || !args.id) {
      throw new Error("Both --url and --id are required for writeback.");
    }
    const { raw } = readEvent(args.eventFile);
    const parsed = matter(raw);
    parsed.data.event_url = args.url;
    parsed.data.event_id = args.id;
    fs.writeFileSync(args.eventFile, matter.stringify(parsed.content, parsed.data));
    console.error(`[updated] ${args.eventFile} with event_url + event_id`);
  },
});

const main = defineCommand({
  meta: {
    name: "meetup-pr-event",
    description:
      "Glue between events/*.md and cppserbia/coopkit-meetup-action (no Meetup API code).",
  },
  subCommands: {
    inputs: inputsCmd,
    writeback: writebackCmd,
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runMain(main).then(() => process.exit(0));
}
