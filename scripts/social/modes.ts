import type { ModeConfig, Mode } from "./types";
import { extractDescription, extractFullDescription } from "./extract";
import { buildRecordingPrompt, buildAnnouncementPrompt } from "./prompts";
import {
  buildRecordingMetadata,
  buildRecordingPayload,
  buildAnnouncementMetadata,
  buildAnnouncementPayload,
} from "./payload";

export const modes: Record<Mode, ModeConfig> = {
  recording: {
    validate(frontmatter, eventFile) {
      return frontmatter.youtube ? null : `No youtube field found in frontmatter of ${eventFile}`;
    },
    logExtra(frontmatter) {
      console.error(`YouTube: ${frontmatter.youtube}`);
    },
    extractDescription,
    buildPrompt: buildRecordingPrompt,
    dryRunFields(frontmatter) {
      return [["YouTube", frontmatter.youtube || "(none)"]];
    },
    buildMetadata: buildRecordingMetadata,
    buildPayload: buildRecordingPayload,
  },
  announcement: {
    validate(frontmatter, eventFile) {
      return frontmatter.status === "DRAFT"
        ? `Event is in DRAFT status — cannot generate announcement for ${eventFile}`
        : null;
    },
    logExtra() {},
    extractDescription: extractFullDescription,
    buildPrompt: buildAnnouncementPrompt,
    dryRunFields(frontmatter) {
      return [
        ["Status", frontmatter.status || "(none)"],
        ["Event URL", frontmatter.event_url || "(none)"],
        ["Venue", frontmatter.venues?.[0] || "(none)"],
      ];
    },
    buildMetadata: buildAnnouncementMetadata,
    buildPayload: buildAnnouncementPayload,
  },
};
