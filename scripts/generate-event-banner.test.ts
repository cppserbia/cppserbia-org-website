// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  formatBannerDate,
  resolveSpeakerForBanner,
  splitTitleLines,
} from "./generate-event-banner";

describe("formatBannerDate", () => {
  it("renders the wednesday in the canonical pipeline format", () => {
    expect(formatBannerDate(new Date("2026-04-29T18:00:00Z"))).toBe("Wednesday, 29. 4. 2026.");
  });

  it("uses single-digit month/day (no leading zero)", () => {
    expect(formatBannerDate(new Date("2026-01-05T18:00:00Z"))).toBe("Monday, 5. 1. 2026.");
  });

  it("handles each weekday", () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.UTC(2026, 0, 4 + i)); // Jan 4 2026 is a Sunday
      expect(formatBannerDate(date)).toBe(`${days[i]}, ${4 + i}. 1. 2026.`);
    }
  });
});

describe("splitTitleLines", () => {
  it("returns one line for a short title", () => {
    expect(splitTitleLines("C++ Beer Wednesday", { targetChars: 28, maxLines: 3 })).toEqual([
      "C++ Beer Wednesday",
    ]);
  });

  it("greedy-packs words to the target width", () => {
    expect(
      splitTitleLines("C++ Serbia Founding Celebration", { targetChars: 18, maxLines: 5 })
    ).toEqual(["C++ Serbia", "Founding", "Celebration"]);
  });

  it("respects maxLines by collapsing overflow into the last line", () => {
    expect(
      splitTitleLines("one two three four five six seven", { targetChars: 4, maxLines: 2 })
    ).toEqual(["one", "two three four five six seven"]);
  });

  it("returns an empty array for empty / whitespace input", () => {
    expect(splitTitleLines("", { targetChars: 10, maxLines: 3 })).toEqual([]);
    expect(splitTitleLines("   ", { targetChars: 10, maxLines: 3 })).toEqual([]);
  });

  it("does not break individual words that exceed the target", () => {
    expect(
      splitTitleLines("supercalifragilisticexpialidocious word", { targetChars: 10, maxLines: 3 })
    ).toEqual(["supercalifragilisticexpialidocious", "word"]);
  });
});

describe("resolveSpeakerForBanner", () => {
  const eventDetailsTable = `## Event Details

| | |
|---|---|
| 👤 **Speaker** | **[Ivan Čukić](https://example.com)** |`;

  it("uses banner_author when explicitly set in frontmatter", () => {
    expect(
      resolveSpeakerForBanner(
        { title: "x", date: new Date(), banner_author: "@ Docker Brewery" },
        eventDetailsTable
      )
    ).toBe("@ Docker Brewery");
  });

  it("trims banner_author whitespace", () => {
    expect(
      resolveSpeakerForBanner(
        { title: "x", date: new Date(), banner_author: "   Custom   " },
        eventDetailsTable
      )
    ).toBe("Custom");
  });

  it("ignores empty banner_author and falls through to body extraction", () => {
    expect(
      resolveSpeakerForBanner(
        { title: "x", date: new Date(), banner_author: "   " },
        eventDetailsTable
      )
    ).toBe("Ivan Čukić");
  });

  it("uses extractSpeakerName output when no banner_author is set", () => {
    expect(resolveSpeakerForBanner({ title: "x", date: new Date() }, eventDetailsTable)).toBe(
      "Ivan Čukić"
    );
  });

  it("falls back to default when neither banner_author nor body has a speaker", () => {
    expect(resolveSpeakerForBanner({ title: "x", date: new Date() }, "no event details here")).toBe(
      "C++ Serbia"
    );
  });

  it("supports a custom fallback", () => {
    expect(
      resolveSpeakerForBanner({ title: "x", date: new Date() }, "no speaker here", "@ The Venue")
    ).toBe("@ The Venue");
  });
});
