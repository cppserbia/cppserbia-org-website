// @vitest-environment node
import { describe, expect, it } from "vitest";

import { planVariants } from "./upload-event-banners";

describe("planVariants", () => {
  const env = {
    publicBase: "https://images.cppserbia.org",
    keyPrefix: "events/",
  };

  it("plans three variants in horizontal/3-4/9-16 order", () => {
    const variants = planVariants("2026-04-29-Test-Event", "/tmp/img", env);
    expect(variants).toHaveLength(3);
    expect(variants[0].jpgPath).toBe("/tmp/img/2026-04-29-Test-Event.jpg");
    expect(variants[1].jpgPath).toBe("/tmp/img/2026-04-29-Test-Event-3-4.jpg");
    expect(variants[2].jpgPath).toBe("/tmp/img/2026-04-29-Test-Event-9-16.jpg");
  });

  it("derives R2 keys with the events/ prefix", () => {
    const variants = planVariants("test-slug", "/tmp/img", env);
    expect(variants.map((v) => v.key)).toEqual([
      "events/test-slug.jpg",
      "events/test-slug-3-4.jpg",
      "events/test-slug-9-16.jpg",
    ]);
  });

  it("derives public URLs from publicBase + keyPrefix", () => {
    const variants = planVariants("slug", "/tmp", env);
    expect(variants.map((v) => v.publicUrl)).toEqual([
      "https://images.cppserbia.org/events/slug.jpg",
      "https://images.cppserbia.org/events/slug-3-4.jpg",
      "https://images.cppserbia.org/events/slug-9-16.jpg",
    ]);
  });

  it("respects a custom keyPrefix", () => {
    const variants = planVariants("slug", "/tmp", {
      publicBase: "https://images.cppserbia.org",
      keyPrefix: "banners/2026/",
    });
    expect(variants[0].key).toBe("banners/2026/slug.jpg");
    expect(variants[0].publicUrl).toBe("https://images.cppserbia.org/banners/2026/slug.jpg");
  });
});
