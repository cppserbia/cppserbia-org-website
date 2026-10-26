// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  formatBannerDate,
  formatBannerDateLine,
  resolveBannerTitleLines,
  resolveSpeakerForBanner,
  splitTitleLines,
} from "./generate-event-banner";

describe("resolveBannerTitleLines", () => {
  const horizontal = { targetChars: 28, maxLines: 3 };
  const vertical = { targetChars: 18, maxLines: 5 };
  const title = "C++ Serbia: The Votes Are In";
  const lines = ["C++ Serbia Beer Wednesday", "The Votes Are In"];

  it("splits the page title when there is no banner_title", () => {
    expect(resolveBannerTitleLines({ title }, horizontal)).toEqual([title]);
  });

  it("uses a banner_title list as explicit lines", () => {
    expect(resolveBannerTitleLines({ title, banner_title: lines }, horizontal)).toEqual(lines);
  });

  it("still wraps an explicit line that is too long for the format", () => {
    expect(resolveBannerTitleLines({ title, banner_title: lines }, vertical)).toEqual([
      "C++ Serbia Beer",
      "Wednesday",
      "The Votes Are In",
    ]);
  });

  it("collapses explicit lines beyond maxLines into the last one", () => {
    expect(
      resolveBannerTitleLines({ title, banner_title: ["a", "b", "c", "d"] }, horizontal)
    ).toEqual(["a", "b", "c d"]);
  });

  it("splits a banner_title string like a title", () => {
    expect(
      resolveBannerTitleLines({ title, banner_title: "C++ Serbia Beer Wednesday" }, vertical)
    ).toEqual(["C++ Serbia Beer", "Wednesday"]);
  });

  it("falls back to the title for an empty or blank banner_title", () => {
    expect(resolveBannerTitleLines({ title, banner_title: [] }, horizontal)).toEqual([title]);
    expect(resolveBannerTitleLines({ title, banner_title: "  " }, horizontal)).toEqual([title]);
  });
});

describe("formatBannerDateLine", () => {
  const date = new Date("2026-10-28T18:00:00.000Z");

  it("is the plain date when there is no venue", () => {
    expect(formatBannerDateLine(date)).toBe("Wednesday, 28. 10. 2026.");
  });

  it("appends banner_venue after an @", () => {
    expect(formatBannerDateLine(date, "Dogma Brewery")).toBe(
      "Wednesday, 28. 10. 2026. @ Dogma Brewery"
    );
  });

  it("trims the venue and ignores a blank one", () => {
    expect(formatBannerDateLine(date, "  Dogma Brewery  ")).toBe(
      "Wednesday, 28. 10. 2026. @ Dogma Brewery"
    );
    expect(formatBannerDateLine(date, "   ")).toBe("Wednesday, 28. 10. 2026.");
  });
});

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

  it("prefers the speaker registry key over the body table", () => {
    expect(
      resolveSpeakerForBanner(
        { title: "x", date: new Date(), speaker: "sergei-blinov" },
        eventDetailsTable
      )
    ).toBe("Sergei Blinov");
  });

  it("joins multiple registry keys for a panel", () => {
    expect(
      resolveSpeakerForBanner(
        { title: "x", date: new Date(), speaker: ["ivan-cukic", "petar-trifunovic"] },
        "no event details here"
      )
    ).toBe("Ivan Čukić & Petar Trifunović");
  });

  it("banner_author still wins over the registry key", () => {
    expect(
      resolveSpeakerForBanner(
        { title: "x", date: new Date(), banner_author: "C++ Serbia", speaker: "sergei-blinov" },
        eventDetailsTable
      )
    ).toBe("C++ Serbia");
  });

  it("falls through to the body table when the registry key is unknown", () => {
    expect(
      resolveSpeakerForBanner(
        { title: "x", date: new Date(), speaker: "nobody-here" },
        eventDetailsTable
      )
    ).toBe("Ivan Čukić");
  });

  it("returns empty (no author line) when neither banner_author nor body has a speaker", () => {
    expect(resolveSpeakerForBanner({ title: "x", date: new Date() }, "no event details here")).toBe(
      ""
    );
  });

  it("supports a custom fallback", () => {
    expect(
      resolveSpeakerForBanner({ title: "x", date: new Date() }, "no speaker here", "@ The Venue")
    ).toBe("@ The Venue");
  });
});
