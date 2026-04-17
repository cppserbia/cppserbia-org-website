// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildCreateEventPayload,
  detectContentType,
  isEventAlreadyCreated,
  stripLeadingHeading,
} from "./create-meetup-event";
import { resolveVenueId } from "./meetup/venues";

describe("stripLeadingHeading", () => {
  it("removes a leading '# Title' line", () => {
    const body = "# My Event\n\nHello world";
    expect(stripLeadingHeading(body)).toBe("Hello world");
  });

  it("trims leading whitespace/newlines from gray-matter content", () => {
    const body = "\n\n# Title\n\nDescription here.";
    expect(stripLeadingHeading(body)).toBe("Description here.");
  });

  it("leaves body untouched when there is no leading H1", () => {
    const body = "Just a paragraph.\n\n## Sub";
    expect(stripLeadingHeading(body)).toBe("Just a paragraph.\n\n## Sub");
  });

  it("does not strip deeper headings", () => {
    const body = "## Subheading\nThen content";
    expect(stripLeadingHeading(body)).toBe("## Subheading\nThen content");
  });

  it("returns empty string when the body is only an H1", () => {
    expect(stripLeadingHeading("# Only title")).toBe("");
  });
});

describe("isEventAlreadyCreated", () => {
  it("is false for null/undefined/empty", () => {
    expect(isEventAlreadyCreated(undefined)).toBe(false);
    expect(isEventAlreadyCreated(null)).toBe(false);
    expect(isEventAlreadyCreated("")).toBe(false);
    expect(isEventAlreadyCreated("   ")).toBe(false);
  });

  it("is false for the template placeholder", () => {
    expect(isEventAlreadyCreated("<Meetup.com Event ID>")).toBe(false);
  });

  it("is true for numeric IDs (string or number)", () => {
    expect(isEventAlreadyCreated("123456789")).toBe(true);
    expect(isEventAlreadyCreated(123456789)).toBe(true);
  });

  it("is false for non-numeric strings", () => {
    expect(isEventAlreadyCreated("abc")).toBe(false);
    expect(isEventAlreadyCreated("12a")).toBe(false);
  });
});

describe("resolveVenueId", () => {
  it("returns the mapped ID for a known venue", () => {
    const map = { "Startit Centar, Belgrade, RS": 42 };
    expect(resolveVenueId("Startit Centar, Belgrade, RS", map)).toBe(42);
  });

  it("throws with a helpful message for unknown venues", () => {
    const map = { "Known Place": 1 };
    expect(() => resolveVenueId("Other Place", map)).toThrowError(/Unknown venue/);
    expect(() => resolveVenueId("Other Place", map)).toThrowError(/"Known Place"/);
  });

  it("throws when the ID is a placeholder zero", () => {
    const map = { "Placeholder Venue": 0 };
    expect(() => resolveVenueId("Placeholder Venue", map)).toThrowError(/placeholder ID/);
  });

  it("lists guidance when the map is empty", () => {
    expect(() => resolveVenueId("Anything", {})).toThrowError(
      /populate scripts\/meetup\/venues\.ts/
    );
  });
});

describe("buildCreateEventPayload", () => {
  const resolveVenue = (name: string) => {
    const map: Record<string, number> = { "Test Venue, Beograd, rs": 777 };
    if (!(name in map)) throw new Error(`unexpected venue ${name}`);
    return map[name];
  };

  const baseFrontmatter = {
    title: "Test Event",
    date: new Date("2025-09-18T18:00:00Z"),
    duration: "PT2H",
    venues: ["Test Venue, Beograd, rs"],
  };

  it("builds a well-formed CreateEventInput for a typical event", () => {
    const payload = buildCreateEventPayload({
      frontmatter: baseFrontmatter,
      body: "# Test Event\n\nThis is the description body.",
      groupUrlname: "cpp-serbia",
      resolveVenue,
    });

    expect(payload).toEqual({
      groupUrlname: "cpp-serbia",
      title: "Test Event",
      description: "This is the description body.",
      startDateTime: "2025-09-18T18:00:00",
      duration: "PT2H",
      venueId: "777",
      publishStatus: "DRAFT",
    });
  });

  it("strips the leading H1 from the description", () => {
    const payload = buildCreateEventPayload({
      frontmatter: baseFrontmatter,
      body: "\n# Something Else\n\nBody text",
      groupUrlname: "cpp-serbia",
      resolveVenue,
    });
    expect(payload.description).toBe("Body text");
  });

  it("throws when title is missing", () => {
    expect(() =>
      buildCreateEventPayload({
        frontmatter: { ...baseFrontmatter, title: "" },
        body: "body",
        groupUrlname: "g",
        resolveVenue,
      })
    ).toThrowError(/title/);
  });

  it("throws when date is missing or invalid", () => {
    expect(() =>
      buildCreateEventPayload({
        frontmatter: {
          ...baseFrontmatter,
          date: undefined as unknown as Date,
        },
        body: "body",
        groupUrlname: "g",
        resolveVenue,
      })
    ).toThrowError(/date/);
  });

  it("throws when venues is empty", () => {
    expect(() =>
      buildCreateEventPayload({
        frontmatter: { ...baseFrontmatter, venues: [] },
        body: "body",
        groupUrlname: "g",
        resolveVenue,
      })
    ).toThrowError(/venues/);
  });

  it("throws when duration is missing", () => {
    expect(() =>
      buildCreateEventPayload({
        frontmatter: { ...baseFrontmatter, duration: undefined },
        body: "body",
        groupUrlname: "g",
        resolveVenue,
      })
    ).toThrowError(/duration/);
  });

  it("drops milliseconds from the startDateTime", () => {
    const payload = buildCreateEventPayload({
      frontmatter: {
        ...baseFrontmatter,
        date: new Date("2025-09-18T18:30:45.123Z"),
      },
      body: "body",
      groupUrlname: "cpp-serbia",
      resolveVenue,
    });
    expect(payload.startDateTime).toBe("2025-09-18T18:30:45");
    expect(payload.startDateTime).not.toContain("Z");
    expect(payload.startDateTime).not.toContain(".");
  });
});

describe("detectContentType", () => {
  it("maps image/jpeg to JPEG", () => {
    expect(detectContentType("image/jpeg")).toBe("JPEG");
  });

  it("maps image/png to PNG", () => {
    expect(detectContentType("image/png")).toBe("PNG");
  });

  it("maps image/gif to GIF", () => {
    expect(detectContentType("image/gif")).toBe("GIF");
  });

  it("is case-insensitive", () => {
    expect(detectContentType("Image/PNG")).toBe("PNG");
  });

  it("tolerates a charset suffix", () => {
    expect(detectContentType("image/jpeg; charset=binary")).toBe("JPEG");
  });

  it("defaults to JPEG for missing headers", () => {
    expect(detectContentType(null)).toBe("JPEG");
    expect(detectContentType(undefined)).toBe("JPEG");
    expect(detectContentType("")).toBe("JPEG");
  });

  it("defaults to JPEG for unknown types", () => {
    expect(detectContentType("application/octet-stream")).toBe("JPEG");
  });
});
