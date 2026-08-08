// @vitest-environment node
// events-server.ts reads the events directory with `fs`, which vite cannot resolve
// under the default jsdom environment.
import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import { type Event, getAllEventsServer, getEventBySlug } from "./events-server";
import { buildOffers, buildPerformer } from "./seo-utils";
import { getSpeaker } from "./speakers";

const BASE_URL = "https://cppserbia.org";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    slug: "test-event",
    title: "Test Event",
    date: Temporal.PlainDate.from("2026-06-25"),
    time: "18:00",
    location: "Beograđanka",
    description: "A test event",
    formattedDate: "June 25, 2026",
    day: "25",
    month: "June",
    year: "2026",
    speakers: [],
    ...overrides,
  };
}

describe("buildPerformer", () => {
  it("returns a Person node carrying the event's affiliation", () => {
    const speaker = getSpeaker("sergei-blinov");
    expect(speaker).not.toBeNull();

    const performer = buildPerformer(
      makeEvent({ speakers: [{ ...speaker!, worksFor: "web3mine" }] }),
      BASE_URL
    );

    expect(performer).toMatchObject({
      "@type": "Person",
      name: "Sergei Blinov",
      sameAs: ["https://www.linkedin.com/in/awnion/"],
      worksFor: { "@type": "Organization", name: "web3mine" },
    });
  });

  it("includes url when the speaker has a personal site", () => {
    const performer = buildPerformer(
      makeEvent({ speakers: [getSpeaker("ivica-bogosavljevic")!] }),
      BASE_URL
    );

    expect(performer).toMatchObject({ url: "https://johnnysswlab.com/" });
  });

  it("omits optional keys the speaker does not have", () => {
    const performer = buildPerformer(
      makeEvent({ speakers: [getSpeaker("milos-andjelkovic")!] }),
      BASE_URL
    );

    expect(performer).not.toHaveProperty("url");
    expect(performer).not.toHaveProperty("jobTitle");
    expect(performer).not.toHaveProperty("worksFor");
  });

  it("returns an array for a panel of speakers", () => {
    const performer = buildPerformer(
      makeEvent({ speakers: [getSpeaker("ivan-cukic")!, getSpeaker("petar-trifunovic")!] }),
      BASE_URL
    );

    expect(Array.isArray(performer)).toBe(true);
    expect(performer).toHaveLength(2);
  });

  it("falls back to the community Organization when there is no speaker", () => {
    // e.g. 2024-08-30-Cpp-Serbia-Picnic — a real event with no individual performer
    const performer = buildPerformer(makeEvent({ speakers: [] }), BASE_URL);

    expect(performer).toEqual({
      "@type": "Organization",
      name: "C++ Serbia Community",
      url: BASE_URL,
    });
  });
});

describe("buildOffers", () => {
  it("uses createdAt as validFrom", () => {
    const offers = buildOffers(
      makeEvent({
        registrationLink: "https://www.meetup.com/cpp-serbia/events/315300900/",
        createdAt: "2026-06-16T12:00:00.000Z",
      }),
      "2026-06-25T18:00:00+02:00"
    );

    expect(offers).toEqual({
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      url: "https://www.meetup.com/cpp-serbia/events/315300900/",
      availability: "https://schema.org/InStock",
      validFrom: "2026-06-16T12:00:00.000Z",
    });
  });

  it("falls back to the start date when createdAt is missing", () => {
    const offers = buildOffers(
      makeEvent({ registrationLink: "https://example.com/register" }),
      "2026-06-25T18:00:00+02:00"
    );

    expect(offers?.validFrom).toBe("2026-06-25T18:00:00+02:00");
  });

  it("returns undefined without a registration link", () => {
    expect(buildOffers(makeEvent(), "2026-06-25T18:00:00+02:00")).toBeUndefined();
  });
});

// Guards the two Search Console warnings end-to-end: real markdown -> parsed Event -> JSON-LD
describe("real event files", () => {
  it("a talk resolves its speaker and emits a Person performer", () => {
    const event = getEventBySlug("2026-06-25-Least-Frequently-Used-Cache");
    expect(event).not.toBeNull();
    expect(event!.speakers.map((s) => s.name)).toEqual(["Sergei Blinov"]);
    expect(buildPerformer(event!, BASE_URL)).toMatchObject({
      "@type": "Person",
      name: "Sergei Blinov",
      worksFor: { "@type": "Organization", name: "web3mine" },
    });
  });

  it("keeps affiliation per event, so it does not rot across years", () => {
    // Same person, two talks — each keeps the role recorded on that event
    const older = getEventBySlug("2025-06-25-A-Cpp-Tooling-Journey");
    const newer = getEventBySlug("2026-01-28-what-is-going-on-with-contracts");
    expect(older!.speakers[0].name).toBe("Aleksandr Timofeev");
    expect(newer!.speakers[0].name).toBe("Aleksandr Timofeev");
    // The registry entry itself carries no affiliation
    expect(getSpeaker("aleksandr-timofeev")).not.toHaveProperty("worksFor");
  });

  it("a panel emits one Person per speaker with their own employer", () => {
    const event = getEventBySlug("2026-02-25-How-to-modernize-your-codebase");
    const performer = buildPerformer(event!, BASE_URL) as Array<Record<string, unknown>>;
    expect(performer).toHaveLength(4);
    expect(performer.map((p) => (p.worksFor as { name: string }).name)).toEqual([
      "KDAB",
      "Zühlke",
      "Inceptive",
      "Nutanix",
    ]);
  });

  it("a community event falls back to the Organization performer", () => {
    const event = getEventBySlug("2024-08-30-Cpp-Serbia-Picnic");
    expect(event).not.toBeNull();
    expect(event!.speakers).toEqual([]);
    expect(buildPerformer(event!, BASE_URL)).toMatchObject({ "@type": "Organization" });
  });

  it("every event emits offers with a validFrom", () => {
    const events = getAllEventsServer();
    expect(events.length).toBeGreaterThan(50);

    for (const event of events) {
      const offers = buildOffers(event, event.date.toString());
      expect(offers, `${event.slug}: no offers emitted`).toBeDefined();
      expect(offers!.validFrom, `${event.slug}: empty validFrom`).toBeTruthy();
      expect(
        Number.isNaN(new Date(offers!.validFrom).getTime()),
        `${event.slug}: validFrom is not a valid date (${offers!.validFrom})`
      ).toBe(false);
    }
  });

  it("every event emits a performer", () => {
    for (const event of getAllEventsServer()) {
      expect(buildPerformer(event, BASE_URL), `${event.slug}: no performer`).toBeTruthy();
    }
  });
});
