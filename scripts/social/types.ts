export type { EventFrontmatter } from "../types";
import type { EventFrontmatter } from "../types";

// Result type
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// LLM error variants (replaces LlmApiError class)
export type LlmError =
  | { kind: "timeout"; message: string }
  | { kind: "auth"; message: string; status: number }
  | { kind: "server"; message: string; status: number }
  | { kind: "client"; message: string; status: number }
  | { kind: "no-content"; message: string };

export type Mode = "recording" | "announcement";

export interface ModeConfig {
  validate: (frontmatter: EventFrontmatter, eventFile: string) => string | null;
  logExtra: (frontmatter: EventFrontmatter) => void;
  extractDescription: (content: string, frontmatterDesc?: string) => string;
  buildPrompt: (title: string, description: string, speaker: string | null) => string;
  dryRunFields: (frontmatter: EventFrontmatter) => Array<[string, string]>;
  buildMetadata: (frontmatter: EventFrontmatter, slug: string) => Record<string, unknown>;
  buildPayload: (
    frontmatter: EventFrontmatter,
    slug: string,
    en: string,
    sr: string
  ) => Record<string, unknown>;
}
