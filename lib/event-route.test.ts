import { describe, expect, it } from "vitest";

import { unknownEventLocale } from "./event-route";

const locales = ["en", "sr"];
const slugs = new Set(["2026-10-28-Cpp-Serbia-The-Votes-Are-In"]);

describe("unknownEventLocale", () => {
  it("returns the locale for an event slug that is not published", () => {
    expect(unknownEventLocale("/en/events/2099-01-01-Not-Yet-Deployed", locales, slugs)).toBe("en");
    expect(unknownEventLocale("/sr/events/2099-01-01-Not-Yet-Deployed/", locales, slugs)).toBe(
      "sr"
    );
  });

  it("lets published events through", () => {
    expect(
      unknownEventLocale("/sr/events/2026-10-28-Cpp-Serbia-The-Votes-Are-In", locales, slugs)
    ).toBeNull();
  });

  it("ignores everything that is not an event page", () => {
    for (const path of [
      "/en/events",
      "/en/events/2099-01-01-Not-Yet-Deployed/opengraph-image",
      "/events/2099-01-01-Not-Yet-Deployed",
      "/de/events/2099-01-01-Not-Yet-Deployed",
      "/en/about",
    ]) {
      expect(unknownEventLocale(path, locales, slugs)).toBeNull();
    }
  });

  it("decodes the slug and treats a malformed escape as unknown", () => {
    expect(
      unknownEventLocale("/en/events/2026-10-28-Cpp-Serbia-The-Votes-Are-%49n", locales, slugs)
    ).toBeNull();
    expect(unknownEventLocale("/en/events/%E0%A4%A", locales, slugs)).toBe("en");
  });
});
