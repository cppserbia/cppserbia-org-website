// @vitest-environment node
import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

import {
  extractDescription,
  extractFullDescription,
  extractSpeakerName,
  extractYouTubeVideoId,
  parseSocialText,
} from "./social/extract";
import {
  buildAnnouncementMetadata,
  buildAnnouncementPayload,
  buildRecordingMetadata,
  buildRecordingPayload,
} from "./social/payload";
import { readEventFile } from "./social/read-event";

describe("parseSocialText", () => {
  it("extracts EN and SR from standard bold format", () => {
    const text = `🇬🇧 **English:**
Missed our latest meetup? Recording is up! ▶️

🇷🇸 **Srpski:**
Propustili ste poslednji meetup? Snimak je dostupan! ▶️`;

    const result = parseSocialText(text);
    expect(result.en).toBe("Missed our latest meetup? Recording is up! ▶️");
    expect(result.sr).toBe("Propustili ste poslednji meetup? Snimak je dostupan! ▶️");
  });

  it("extracts EN and SR without bold markdown", () => {
    const text = `🇬🇧 English:
Check out the recording! 🎬

🇷🇸 Srpski:
Pogledajte snimak! 🎬`;

    const result = parseSocialText(text);
    expect(result.en).toBe("Check out the recording! 🎬");
    expect(result.sr).toBe("Pogledajte snimak! 🎬");
  });

  it("trims extra whitespace and newlines", () => {
    const text = `🇬🇧 **English:**

  Some English text with spaces

🇷🇸 **Srpski:**

  Neki srpski tekst
`;

    const result = parseSocialText(text);
    expect(result.en).toBe("Some English text with spaces");
    expect(result.sr).toBe("Neki srpski tekst");
  });

  it("returns en text and empty sr when Serbian block is missing", () => {
    const text = `🇬🇧 **English:**
Only English here`;

    const result = parseSocialText(text);
    expect(result.en).toBe("Only English here");
    expect(result.sr).toBe("");
  });

  it("returns empty strings for empty input", () => {
    const result = parseSocialText("");
    expect(result).toEqual({ en: "", sr: "" });
  });
});

describe("extractYouTubeVideoId", () => {
  it("extracts ID from standard watch URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts ID from short youtu.be URL", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from embed URL", () => {
    expect(extractYouTubeVideoId("https://youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID when URL has extra query params", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("returns null for non-YouTube URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/video")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractYouTubeVideoId("")).toBeNull();
  });
});

describe("parseSocialText — announcement style", () => {
  it("extracts announcement-style text with invitation tone", () => {
    const text = `🇬🇧 **English:**
Join us for a deep dive into codebase modernization! 🚀

🇷🇸 **Srpski:**
Pridružite nam se za duboko uranjanje u modernizaciju koda! 🚀`;

    const result = parseSocialText(text);
    expect(result.en).toBe("Join us for a deep dive into codebase modernization! 🚀");
    expect(result.sr).toBe("Pridružite nam se za duboko uranjanje u modernizaciju koda! 🚀");
  });

  it("handles topic-focused text without speaker name", () => {
    const text = `🇬🇧 **English:**
How do you move a massive C++ codebase forward? Strategies and live Q&A at our next meetup 🎯

🇷🇸 **Srpski:**
Kako unaprediti veliki C++ projekat? Strategije i Q&A na našem sledećem meetup-u 🎯`;

    const result = parseSocialText(text);
    expect(result.en).toContain("massive C++ codebase");
    expect(result.sr).toContain("C++ projekat");
  });
});

describe("extractSpeakerName", () => {
  it("extracts speaker from linked format: **[Name](url)**", () => {
    const content = `## Event Details

| | |
|---|---|
| 👤 **Speaker** | **[John Doe](https://example.com)** |`;

    expect(extractSpeakerName(content)).toBe("John Doe");
  });

  it("extracts speaker from bold format: **Name**", () => {
    const content = `## Event Details

| | |
|---|---|
| 👤 **Speaker** | **Jane Smith** |`;

    expect(extractSpeakerName(content)).toBe("Jane Smith");
  });

  it("returns null when no speaker is found", () => {
    const content = `## Event Details

| | |
|---|---|
| 📍 **Location** | **Belgrade** |`;

    expect(extractSpeakerName(content)).toBeNull();
  });
});

describe("extractDescription", () => {
  it("returns frontmatter description when provided", () => {
    expect(extractDescription("body text", "frontmatter desc")).toBe("frontmatter desc");
  });

  it("extracts first meaningful paragraph from content when no frontmatter description", () => {
    const content = `# Some Title

This is a short line.

This is a meaningful paragraph that is definitely longer than fifty characters in total length.

## Another Section`;

    expect(extractDescription(content)).toBe(
      "This is a meaningful paragraph that is definitely longer than fifty characters in total length."
    );
  });

  it("skips headings, list items, and short lines", () => {
    const content = `# Title
* bullet point
- another bullet
Short.

A longer paragraph that exceeds the fifty character minimum threshold for extraction.`;

    expect(extractDescription(content)).toBe(
      "A longer paragraph that exceeds the fifty character minimum threshold for extraction."
    );
  });

  it("returns empty string when no suitable paragraph found", () => {
    const content = `# Title
* item
- item`;

    expect(extractDescription(content)).toBe("");
  });
});

describe("extractFullDescription", () => {
  it("returns frontmatter description when provided", () => {
    expect(extractFullDescription("body text", "frontmatter desc")).toBe("frontmatter desc");
  });

  it("returns full body before Event Details section", () => {
    const content = `# How to modernize your codebase?

## C++ Serbia Community Panel

We have gathered a panel of experts.

## What We Will Cover

* **Strategies for incremental adoption.**
* **Live Q&A.**

## 📅 Event Details

| | |
|---|---|
| 🕕 **Date & Time** | **25th of February** |`;

    const result = extractFullDescription(content);
    expect(result).toContain("panel of experts");
    expect(result).toContain("What We Will Cover");
    expect(result).toContain("Strategies for incremental adoption");
    expect(result).not.toContain("Event Details");
    expect(result).not.toContain("25th of February");
  });

  it("returns full content when no Event Details section exists", () => {
    const content = `# Title

Some description paragraph.

* Bullet point`;

    const result = extractFullDescription(content);
    expect(result).toContain("Some description paragraph");
    expect(result).toContain("Bullet point");
  });
});

describe("readEventFile", () => {
  it("returns error when file does not exist", () => {
    const result = readEventFile("/tmp/nonexistent-event-file-xyz.md");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("File not found");
    }
  });

  it("returns error when required frontmatter fields are missing", () => {
    const tmpFile = path.join(os.tmpdir(), "test-missing-fields.md");
    fs.writeFileSync(tmpFile, "---\nstatus: ACTIVE\n---\nSome content");
    try {
      const result = readEventFile(tmpFile);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("missing required frontmatter fields");
      }
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("reads a valid event file", () => {
    const tmpFile = path.join(os.tmpdir(), "2025-01-01-Test-Event.md");
    fs.writeFileSync(
      tmpFile,
      "---\ntitle: Test Event\ndate: 2025-01-01\nstatus: ACTIVE\n---\n# Test Event\n\nSome content."
    );
    try {
      const result = readEventFile(tmpFile);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.frontmatter.title).toBe("Test Event");
        expect(result.value.slug).toBe("2025-01-01-Test-Event");
        expect(result.value.content).toContain("Some content.");
      }
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

describe("buildRecordingPayload", () => {
  it("builds correct payload with youtube URL", () => {
    const frontmatter = {
      title: "Test Talk",
      date: new Date("2025-06-15T18:00:00Z"),
      youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      imageUrl: "https://images.cppserbia.org/test.jpg",
    };

    const payload = buildRecordingPayload(
      frontmatter,
      "2025-06-15-Test-Talk",
      "Hello EN",
      "Zdravo SR"
    );

    expect(payload.social_text_en).toBe("Hello EN");
    expect(payload.social_text_sr).toBe("Zdravo SR");
    expect(payload.youtube_url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(payload.youtube_thumbnail_url).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    );
    expect(payload.event_title).toBe("Test Talk");
    expect(payload.event_slug).toBe("2025-06-15-Test-Talk");
    expect(payload.image_url).toBe("https://images.cppserbia.org/test.jpg");
  });

  it("handles missing youtube URL gracefully", () => {
    const frontmatter = {
      title: "No Video Talk",
      date: new Date("2025-06-15T18:00:00Z"),
    };

    const payload = buildRecordingPayload(frontmatter, "slug", "en", "sr");
    expect(payload.youtube_url).toBe("");
    expect(payload.youtube_thumbnail_url).toBe("");
    expect(payload.image_url).toBe("");
  });
});

describe("buildAnnouncementPayload", () => {
  it("builds correct payload with all fields", () => {
    const frontmatter = {
      title: "Upcoming Talk",
      date: new Date("2025-07-20T18:00:00Z"),
      event_type: "PHYSICAL" as const,
      venues: ["Startit Centar"],
      event_url: "https://meetup.com/event/123",
      imageUrl: "https://images.cppserbia.org/upcoming.jpg",
    };

    const payload = buildAnnouncementPayload(
      frontmatter,
      "2025-07-20-Upcoming-Talk",
      "Join us!",
      "Pridružite se!"
    );

    expect(payload.type).toBe("announcement");
    expect(payload.social_text_en).toBe("Join us!");
    expect(payload.social_text_sr).toBe("Pridružite se!");
    expect(payload.event_title).toBe("Upcoming Talk");
    expect(payload.event_date).toBe("2025-07-20T18:00:00");
    expect(payload.event_type).toBe("PHYSICAL");
    expect(payload.venue).toBe("Startit Centar");
    expect(payload.registration_url).toBe("https://meetup.com/event/123");
    expect(payload.event_url).toContain("/events/2025-07-20-Upcoming-Talk");
  });

  it("handles missing optional fields", () => {
    const frontmatter = {
      title: "Minimal Event",
      date: new Date("2025-07-20T18:00:00Z"),
    };

    const payload = buildAnnouncementPayload(frontmatter, "slug", "en", "sr");
    expect(payload.event_type).toBe("");
    expect(payload.venue).toBe("");
    expect(payload.registration_url).toBe("");
    expect(payload.image_url).toBe("");
  });

  it("handles non-zero milliseconds in date correctly", () => {
    const frontmatter = {
      title: "Test",
      date: new Date("2025-07-20T18:30:45.123Z"),
    };

    const payload = buildAnnouncementPayload(frontmatter, "slug", "en", "sr");
    expect(payload.event_date).toBe("2025-07-20T18:30:45");
    expect(payload.event_date).not.toContain("Z");
    expect(payload.event_date).not.toContain(".");
  });
});

describe("buildRecordingMetadata", () => {
  it("returns metadata without social text fields", () => {
    const frontmatter = {
      title: "Test Talk",
      date: new Date("2025-06-15T18:00:00Z"),
      youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      imageUrl: "https://images.cppserbia.org/test.jpg",
    };

    const metadata = buildRecordingMetadata(frontmatter, "2025-06-15-Test-Talk");

    expect(metadata.youtube_url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(metadata.youtube_thumbnail_url).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    );
    expect(metadata.event_title).toBe("Test Talk");
    expect(metadata.event_slug).toBe("2025-06-15-Test-Talk");
    expect(metadata.image_url).toBe("https://images.cppserbia.org/test.jpg");
    expect(metadata).not.toHaveProperty("social_text_en");
    expect(metadata).not.toHaveProperty("social_text_sr");
  });

  it("matches buildRecordingPayload fields (minus social text)", () => {
    const frontmatter = {
      title: "Test Talk",
      date: new Date("2025-06-15T18:00:00Z"),
      youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    };

    const metadata = buildRecordingMetadata(frontmatter, "slug");
    const payload = buildRecordingPayload(frontmatter, "slug", "en", "sr");

    const { social_text_en, social_text_sr, ...payloadWithoutSocial } = payload;
    expect(metadata).toEqual(payloadWithoutSocial);
  });
});

describe("buildAnnouncementMetadata", () => {
  it("returns metadata without social text fields", () => {
    const frontmatter = {
      title: "Upcoming Talk",
      date: new Date("2025-07-20T18:00:00Z"),
      event_type: "PHYSICAL" as const,
      venues: ["Startit Centar"],
      event_url: "https://meetup.com/event/123",
      imageUrl: "https://images.cppserbia.org/upcoming.jpg",
    };

    const metadata = buildAnnouncementMetadata(frontmatter, "2025-07-20-Upcoming-Talk");

    expect(metadata.type).toBe("announcement");
    expect(metadata.event_title).toBe("Upcoming Talk");
    expect(metadata.event_date).toBe("2025-07-20T18:00:00");
    expect(metadata.event_type).toBe("PHYSICAL");
    expect(metadata.venue).toBe("Startit Centar");
    expect(metadata.registration_url).toBe("https://meetup.com/event/123");
    expect(metadata.event_url).toContain("/events/2025-07-20-Upcoming-Talk");
    expect(metadata).not.toHaveProperty("social_text_en");
    expect(metadata).not.toHaveProperty("social_text_sr");
  });

  it("matches buildAnnouncementPayload fields (minus social text)", () => {
    const frontmatter = {
      title: "Upcoming Talk",
      date: new Date("2025-07-20T18:00:00Z"),
      event_type: "PHYSICAL" as const,
      venues: ["Startit Centar"],
    };

    const metadata = buildAnnouncementMetadata(frontmatter, "slug");
    const payload = buildAnnouncementPayload(frontmatter, "slug", "en", "sr");

    const { social_text_en, social_text_sr, ...payloadWithoutSocial } = payload;
    expect(metadata).toEqual(payloadWithoutSocial);
  });
});

describe("parseSocialText — edge cases", () => {
  it("returns empty strings when no emoji flags present", () => {
    const result = parseSocialText("Some random text without flags");
    expect(result.en).toBe("");
    expect(result.sr).toBe("");
  });

  it("handles multiline content in both sections", () => {
    const text = `🇬🇧 **English:**
Line one of English.
Line two of English.

🇷🇸 **Srpski:**
Line one of Serbian.
Line two of Serbian.`;

    const result = parseSocialText(text);
    expect(result.en).toContain("Line one of English.");
    expect(result.en).toContain("Line two of English.");
    expect(result.sr).toContain("Line one of Serbian.");
    expect(result.sr).toContain("Line two of Serbian.");
  });
});
