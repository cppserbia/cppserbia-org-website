import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { getSpeaker, type Speaker, SPEAKERS } from "./speakers";

const EVENTS_DIR = path.join(process.cwd(), "events");
const URL_FIELDS = ["imageUrl", "event_url", "youtube"] as const;

const eventFiles = fs
  .readdirSync(EVENTS_DIR)
  .filter((f) => f.endsWith(".md") && f !== "_template-event.md");

// Template placeholders like "<Meetup.com Event URL>" mean "not yet populated";
// the meetup-event automation fills real values in on PR label trigger.
const isPlaceholder = (v: string) => /^<.*>$/.test(v);

describe("Event frontmatter validation", () => {
  describe("URL fields must not contain literal quote characters", () => {
    const cases = eventFiles.flatMap((file) => {
      const raw = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      return URL_FIELDS.filter((field) => data[field] && !isPlaceholder(String(data[field]))).map(
        (field) => ({
          file,
          field,
          value: String(data[field]),
        })
      );
    });

    it.each(cases)("$file — $field has no literal quotes", ({ file, field, value }) => {
      expect(
        value,
        `${file}: "${field}" contains literal quote characters.\n  Value: ${value}\n  Hint: remove wrapping quotes inside YAML block scalars (>- or |)`
      ).not.toMatch(/['"]/);
    });
  });

  describe("URL fields must start with http:// or https://", () => {
    const cases = eventFiles.flatMap((file) => {
      const raw = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      return URL_FIELDS.filter((field) => data[field] && !isPlaceholder(String(data[field]))).map(
        (field) => ({
          file,
          field,
          value: String(data[field]),
        })
      );
    });

    it.each(cases)("$file — $field starts with http(s)://", ({ file, field, value }) => {
      expect(
        value,
        `${file}: "${field}" does not start with http:// or https://.\n  Value: ${value}`
      ).toMatch(/^https?:\/\//);
    });
  });

  // `created` feeds offers.validFrom in the Event JSON-LD — see lib/seo-utils.ts
  describe("created must be a valid date", () => {
    const cases = eventFiles.map((file) => {
      const raw = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      return { file, created: data.created };
    });

    it.each(cases)("$file — created parses to a valid date", ({ file, created }) => {
      expect(created, `${file}: missing "created" frontmatter field`).toBeDefined();
      const parsed = created instanceof Date ? created : new Date(String(created));
      expect(
        Number.isNaN(parsed.getTime()),
        `${file}: "created" is not a valid date.\n  Value: ${String(created)}`
      ).toBe(false);
    });
  });

  // `speaker` feeds performer in the Event JSON-LD — see lib/seo-utils.ts
  describe("speaker keys must resolve in the registry", () => {
    const cases = eventFiles.flatMap((file) => {
      const raw = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      if (!data.speaker) return [];
      const refs = Array.isArray(data.speaker) ? data.speaker : [data.speaker];
      // A ref is either a bare key or { key, worksFor?, jobTitle? }
      return refs.map((ref) => ({ file, key: typeof ref === "string" ? ref : ref.key }));
    });

    it.each(cases)("$file — speaker key $key exists", ({ file, key }) => {
      expect(
        getSpeaker(key),
        `${file}: unknown speaker key "${key}".\n  Hint: add an entry to lib/speakers.ts`
      ).not.toBeNull();
    });
  });
});

describe("Speaker registry", () => {
  // SPEAKERS is `as const`, so entry values narrow to literal types that omit the
  // optional keys — widen back to Speaker to read url/sameAs uniformly.
  const entries = Object.entries(SPEAKERS) as Array<[string, Speaker]>;

  it.each(entries)("%s has a non-empty name", (_key, speaker) => {
    expect(speaker.name.trim()).not.toBe("");
  });

  const links = entries.flatMap(([key, speaker]) => [
    ...(speaker.url ? [{ key, url: speaker.url }] : []),
    ...(speaker.sameAs ?? []).map((url) => ({ key, url })),
  ]);

  it.each(links)("$key — $url starts with http(s)://", ({ url }) => {
    expect(url).toMatch(/^https?:\/\//);
  });
});
