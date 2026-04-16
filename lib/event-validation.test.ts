import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

const EVENTS_DIR = path.join(process.cwd(), "events");
const URL_FIELDS = ["imageUrl", "event_url", "youtube"] as const;

const eventFiles = fs
  .readdirSync(EVENTS_DIR)
  .filter((f) => f.endsWith(".md") && f !== "_template-event.md");

describe("Event frontmatter validation", () => {
  describe("URL fields must not contain literal quote characters", () => {
    const cases = eventFiles.flatMap((file) => {
      const raw = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      return URL_FIELDS.filter((field) => data[field]).map((field) => ({
        file,
        field,
        value: String(data[field]),
      }));
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
      return URL_FIELDS.filter((field) => data[field]).map((field) => ({
        file,
        field,
        value: String(data[field]),
      }));
    });

    it.each(cases)("$file — $field starts with http(s)://", ({ file, field, value }) => {
      expect(
        value,
        `${file}: "${field}" does not start with http:// or https://.\n  Value: ${value}`
      ).toMatch(/^https?:\/\//);
    });
  });
});
