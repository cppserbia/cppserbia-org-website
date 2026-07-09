// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildActionInputs } from "./meetup-pr-event";

const baseFrontmatter = {
  title: "Test Event",
  date: new Date("2026-04-29T18:00:00.000Z"),
  duration: "PT3H",
  venues: ["Docker Brewery & Beer Garden, Beograd, rs"],
};

describe("buildActionInputs", () => {
  it("maps a typical event's frontmatter to action inputs", () => {
    const inputs = buildActionInputs(
      baseFrontmatter,
      "# Test Event\n\nThis is the description body."
    );

    expect(inputs).toEqual({
      title: "Test Event",
      date: "2026-04-29T18:00:00.000Z",
      duration: "PT3H",
      "venue-key": "Docker Brewery & Beer Garden, Beograd, rs",
      description: "This is the description body.",
      "image-url": "",
      "already-created": "false",
    });
  });

  it("normalizes a tz-less date to canonical UTC (gray-matter parses YAML dates as UTC)", () => {
    const inputs = buildActionInputs(
      { ...baseFrontmatter, date: new Date("2016-12-08T18:00:00.000Z") },
      "body"
    );
    expect(inputs.date).toBe("2016-12-08T18:00:00.000Z");
  });

  it("strips the leading H1 from the description", () => {
    const inputs = buildActionInputs(baseFrontmatter, "\n# Something Else\n\nBody text");
    expect(inputs.description).toBe("Body text");
  });

  it("passes imageUrl through when present", () => {
    const inputs = buildActionInputs(
      { ...baseFrontmatter, imageUrl: "https://images.cppserbia.org/events/x.png" },
      "body"
    );
    expect(inputs["image-url"]).toBe("https://images.cppserbia.org/events/x.png");
  });

  it("flags already-created when a numeric event_id is present", () => {
    expect(
      buildActionInputs({ ...baseFrontmatter, event_id: 314504530 }, "b")["already-created"]
    ).toBe("true");
    expect(
      buildActionInputs({ ...baseFrontmatter, event_id: "314504530" }, "b")["already-created"]
    ).toBe("true");
  });

  it("does not flag the template placeholder as already-created", () => {
    expect(
      buildActionInputs({ ...baseFrontmatter, event_id: "<Meetup.com Event ID>" }, "b")[
        "already-created"
      ]
    ).toBe("false");
  });

  it("throws when title is missing", () => {
    expect(() => buildActionInputs({ ...baseFrontmatter, title: "" }, "b")).toThrowError(/title/);
  });

  it("throws when date is missing or invalid", () => {
    expect(() =>
      buildActionInputs({ ...baseFrontmatter, date: undefined as unknown as Date }, "b")
    ).toThrowError(/date/);
  });

  it("throws when venues is empty", () => {
    expect(() => buildActionInputs({ ...baseFrontmatter, venues: [] }, "b")).toThrowError(/venues/);
  });

  it("throws when duration is missing", () => {
    expect(() => buildActionInputs({ ...baseFrontmatter, duration: undefined }, "b")).toThrowError(
      /duration/
    );
  });
});
