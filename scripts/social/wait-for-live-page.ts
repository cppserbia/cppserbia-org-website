import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { eventPageUrl, parsePayloadText } from "./payload";

// Facebook and Telegram build the link preview by scraping the event page. The publish
// workflow starts the moment the PR merges, usually before Vercel has deployed it, so a new
// event's URL still serves the generic "C++ Serbia" fallback (with a 200), and the platforms
// cache that preview for days. Wait until the page serves this event's title and banner.

const USAGE = `Usage:
  npx tsx scripts/social/wait-for-live-page.ts payload.json

Env vars:
  WAIT_TIMEOUT_SECONDS   — give up after this long (default 900)
  WAIT_INTERVAL_SECONDS  — pause between checks (default 20)`;

// Next.js renders metadata into <head> only for user agents it recognizes as bots, which is
// what the platforms' scrapers send; a browser UA can get it streamed into <body> instead.
const CRAWLER_USER_AGENT = "facebookexternalhit/1.1 (cppserbia publish-social readiness check)";

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1));
      return Number.isNaN(n) ? match : String.fromCodePoint(n);
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** The first value of each `og:*` meta property in the page, entities decoded. */
export function readOpenGraph(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const [, name, value] of tag.matchAll(/([a-z:-]+)\s*=\s*"([^"]*)"/gi)) {
      attrs[name.toLowerCase()] = decodeEntities(value);
    }
    const property = attrs.property;
    if (property?.startsWith("og:") && attrs.content !== undefined && !(property in tags)) {
      tags[property] = attrs.content;
    }
  }
  return tags;
}

export interface ExpectedPreview {
  title: string;
  imageUrl?: string;
}

/** Why the page would not yet give this event's preview; empty when it is ready. */
export function previewProblems(html: string, expected: ExpectedPreview): string[] {
  const og = readOpenGraph(html);
  const problems: string[] = [];
  if (!og["og:title"]?.includes(expected.title)) {
    problems.push(`og:title is ${JSON.stringify(og["og:title"] ?? null)}, not this event's`);
  }
  if (expected.imageUrl && og["og:image"] !== expected.imageUrl) {
    problems.push(`og:image is ${JSON.stringify(og["og:image"] ?? null)}, not the event banner`);
  }
  return problems;
}

async function checkOnce(pageUrl: string, expected: ExpectedPreview): Promise<string[]> {
  const page = await fetch(pageUrl, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
  if (!page.ok) return [`${pageUrl} returned ${page.status}`];
  const problems = previewProblems(await page.text(), expected);
  if (problems.length > 0 || !expected.imageUrl) return problems;

  const image = await fetch(expected.imageUrl, { method: "HEAD" });
  const type = image.headers.get("content-type") ?? "";
  if (!image.ok || !type.startsWith("image/")) {
    return [`banner ${expected.imageUrl} returned ${image.status} ${type}`.trim()];
  }
  return [];
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(USAGE);
    process.exit(1);
  }

  const payload = parsePayloadText(readFileSync(filePath, "utf8"));
  const slug = String(payload.event_slug ?? "");
  const title = String(payload.event_title ?? "");
  if (!slug || !title) {
    console.error("Payload has no event_slug or event_title; cannot tell which page to wait for.");
    process.exit(1);
  }
  const pageUrl = typeof payload.event_url === "string" ? payload.event_url : eventPageUrl(slug);
  const imageUrl =
    typeof payload.image_url === "string" && payload.image_url ? payload.image_url : undefined;

  const timeoutMs = Number(process.env.WAIT_TIMEOUT_SECONDS ?? 900) * 1000;
  const intervalMs = Number(process.env.WAIT_INTERVAL_SECONDS ?? 20) * 1000;
  const deadline = Date.now() + timeoutMs;

  console.log(`Waiting for ${pageUrl} to serve "${title}"${imageUrl ? ` with ${imageUrl}` : ""}`);
  for (;;) {
    const problems = await checkOnce(pageUrl, { title, imageUrl }).catch((err: Error) => [
      `request failed: ${err.message}`,
    ]);
    if (problems.length === 0) {
      console.log("Event page is live with its preview. Safe to post.");
      return;
    }
    console.log(`Not live yet: ${problems.join("; ")}`);
    if (Date.now() + intervalMs > deadline) {
      console.error(
        `Gave up after ${timeoutMs / 1000}s. Not posting: the link preview would be the generic ` +
          `site one. Check the production deploy, then re-run via workflow_dispatch.`
      );
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
