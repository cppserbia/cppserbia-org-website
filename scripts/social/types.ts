export type { EventFrontmatter } from "../types";
import type { EventFrontmatter } from "../types";

export type Mode = "recording" | "announcement";

export interface ModeConfig {
  validate: (frontmatter: EventFrontmatter, eventFile: string) => void;
  logExtra: (frontmatter: EventFrontmatter) => void;
  extractDescription: (content: string, frontmatterDesc?: string) => string;
  buildPrompt: (title: string, description: string, speaker: string | null) => string;
  dryRunFields: (frontmatter: EventFrontmatter) => Array<[string, string]>;
  buildMetadata: (frontmatter: EventFrontmatter, slug: string) => Record<string, unknown>;
  buildPayload: (frontmatter: EventFrontmatter, slug: string, en: string, sr: string) => Record<string, unknown>;
}
