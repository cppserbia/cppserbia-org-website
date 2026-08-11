// @vitest-environment node
// events-server.ts reads the events directory with `fs`, which vite cannot resolve
// under the default jsdom environment.
import { describe, expect, it } from "vitest";

import { type Event, getAllEventsServer, getEventBySlug } from "./events-server";
import { buildOffers, buildPerformer } from "./seo-utils";
import { getSpeaker } from "./speakers";
import { formatEventDate, isPastEvent, today } from "./temporal";

// Offers depend on whether the event has happened, so fixtures are dated relative to
// today rather than pinned — a hardcoded date silently flips meaning as it ages.
const UPCOMING = today().add({ days: 30 });
const PAST = today().subtract({ days: 30 });

function makeEvent(overrides: Partial<Event> = {}): Event {
  const date = overrides.date ?? UPCOMING;
  const { formattedDate, day, month, year } = formatEventDate(date);

  return {
    slug: "test-event",
    title: "Test Event",
    date,
    time: "18:00",
    location: "Beograđanka",
    description: "A test event",
    formattedDate,
    day,
    month,
    year,
    speakers: [],
    ...overrides,
  };
}

describe("buildPerformer", () => {
  it("returns a Person node carrying the event's affiliation", () => {
    const speaker = getSpeaker("sergei-blinov");
    expect(speaker).not.toBeNull();

    const performer = buildPerformer(
      makeEvent({ speakers: [{ ...speaker!, worksFor: "web3mine" }] })
    );

    expect(performer).toMatchObject({
      "@type": "Person",
      name: "Sergei Blinov",
      sameAs: speaker!.sameAs,
      worksFor: { "@type": "Organization", name: "web3mine" },
    });
  });

  it("includes url when the speaker has a personal site", () => {
    const performer = buildPerformer(makeEvent({ speakers: [getSpeaker("ivica-bogosavljevic")!] }));

    expect(performer).toMatchObject({ url: "https://johnnysswlab.com/" });
  });

  it("omits optional keys the speaker does not have", () => {
    // Inline rather than a registry key: this is about which fields buildPerformer
    // emits, and back-filling a portrait onto whichever entry we picked would
    // otherwise break the test.
    const performer = buildPerformer(makeEvent({ speakers: [{ name: "Nameless Speaker" }] }));

    expect(performer).not.toHaveProperty("url");
    expect(performer).not.toHaveProperty("jobTitle");
    expect(performer).not.toHaveProperty("worksFor");
    expect(performer).not.toHaveProperty("image");
    expect(performer).not.toHaveProperty("description");
  });

  it("carries the portrait and bio through to image and description", () => {
    const performer = buildPerformer(
      makeEvent({
        speakers: [
          {
            ...getSpeaker("sergei-blinov")!,
            image: "https://images.cppserbia.org/speaker-avatars/lfu.png",
            bio: "Sergei Blinov is an FDE @ web3mine and a math enthusiast.",
          },
        ],
      })
    );

    expect(performer).toMatchObject({
      image: "https://images.cppserbia.org/speaker-avatars/lfu.png",
      description: "Sergei Blinov is an FDE @ web3mine and a math enthusiast.",
    });
  });

  it("returns an array for a panel of speakers", () => {
    const performer = buildPerformer(
      makeEvent({ speakers: [getSpeaker("ivan-cukic")!, getSpeaker("petar-trifunovic")!] })
    );

    expect(Array.isArray(performer)).toBe(true);
    expect(performer).toHaveLength(2);
  });

  it("emits nothing when there is no speaker", () => {
    // e.g. 2024-08-30-Cpp-Serbia-Picnic — a real event with no individual performer.
    // Google accepts only Person and PerformingGroup here, so the field is dropped
    // rather than filled with the community Organization.
    expect(buildPerformer(makeEvent({ speakers: [] }))).toBeUndefined();
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

  it("returns undefined for a past event, whose registration is not open", () => {
    const offers = buildOffers(
      makeEvent({
        date: PAST,
        registrationLink: "https://www.meetup.com/cpp-serbia/events/315300900/",
        createdAt: "2024-01-01T12:00:00.000Z",
      }),
      "2024-01-15T18:00:00+01:00"
    );

    expect(offers).toBeUndefined();
  });

  it("still emits offers for an event happening today", () => {
    const offers = buildOffers(
      makeEvent({ date: today(), registrationLink: "https://example.com/register" }),
      "2026-06-25T18:00:00+02:00"
    );

    expect(offers?.availability).toBe("https://schema.org/InStock");
  });
});

// Guards the two Search Console warnings end-to-end: real markdown -> parsed Event -> JSON-LD
describe("real event files", () => {
  it("a talk resolves its speaker and emits a Person performer", () => {
    const event = getEventBySlug("2026-06-25-Least-Frequently-Used-Cache");
    expect(event).not.toBeNull();
    expect(event!.speakers.map((s) => s.name)).toEqual(["Sergei Blinov"]);
    expect(buildPerformer(event!)).toMatchObject({
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
    const performer = buildPerformer(event!) as Array<Record<string, unknown>>;
    expect(performer).toHaveLength(4);
    expect(performer.map((p) => (p.worksFor as { name: string }).name)).toEqual([
      "KDAB",
      "Zühlke",
      "Inceptive",
      "Nutanix",
    ]);
  });

  it("a community event emits no performer at all", () => {
    const event = getEventBySlug("2024-08-30-Cpp-Serbia-Picnic");
    expect(event).not.toBeNull();
    expect(event!.speakers).toEqual([]);
    expect(buildPerformer(event!)).toBeUndefined();
  });

  it("every upcoming event emits offers with a valid validFrom", () => {
    const events = getAllEventsServer();
    expect(events.length).toBeGreaterThan(50);

    for (const event of events.filter((e) => !isPastEvent(e.date) && e.registrationLink)) {
      const offers = buildOffers(event, event.date.toString());
      expect(offers, `${event.slug}: no offers emitted`).toBeDefined();
      expect(offers!.validFrom, `${event.slug}: empty validFrom`).toBeTruthy();
      expect(
        Number.isNaN(new Date(offers!.validFrom).getTime()),
        `${event.slug}: validFrom is not a valid date (${offers!.validFrom})`
      ).toBe(false);
    }
  });

  it("no past event advertises an open registration", () => {
    const past = getAllEventsServer().filter((event) => isPastEvent(event.date));
    expect(past.length).toBeGreaterThan(50);

    for (const event of past) {
      expect(
        buildOffers(event, event.date.toString()),
        `${event.slug}: past event still emits offers`
      ).toBeUndefined();
    }
  });

  it("every event with a speaker emits a Person performer", () => {
    const withSpeakers = getAllEventsServer().filter((event) => event.speakers.length > 0);
    expect(withSpeakers.length).toBeGreaterThan(40);

    for (const event of withSpeakers) {
      const performer = buildPerformer(event);
      const people = Array.isArray(performer) ? performer : [performer];
      expect(people, `${event.slug}: performer count`).toHaveLength(event.speakers.length);
      for (const person of people) {
        expect(person, `${event.slug}: not a Person`).toMatchObject({ "@type": "Person" });
      }
    }
  });
});
