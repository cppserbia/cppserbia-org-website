import { describe, expect, it } from "vitest";

import { type EventSpeaker, getSpeaker, resolveSpeakers, withEventAvatar } from "./speakers";

const AVATAR = "https://images.cppserbia.org/speaker-avatars/some-event.png";

describe("resolveSpeakers", () => {
  it("carries the per-event bio onto the registry entry", () => {
    const [speaker] = resolveSpeakers(
      { key: "sergei-blinov", worksFor: "web3mine", bio: "A math enthusiast." },
      "some-event"
    );

    expect(speaker).toMatchObject({
      name: "Sergei Blinov",
      worksFor: "web3mine",
      bio: "A math enthusiast.",
    });
  });

  it("carries the registry key through, so a panel has stable React keys", () => {
    const panel = resolveSpeakers(["ivan-cukic", { key: "petar-trifunovic" }], "some-event");

    expect(panel.map((speaker) => speaker.key)).toEqual(["ivan-cukic", "petar-trifunovic"]);
  });

  it("leaves bio unset for a bare key", () => {
    const [speaker] = resolveSpeakers("sergei-blinov", "some-event");

    expect(speaker).not.toHaveProperty("bio");
  });
});

describe("withEventAvatar", () => {
  const lone = (overrides: Partial<EventSpeaker> = {}): EventSpeaker[] => [
    { ...getSpeaker("sergei-blinov")!, ...overrides },
  ];

  it("gives a lone speaker the event's banner portrait", () => {
    expect(withEventAvatar(lone(), AVATAR)[0].image).toBe(AVATAR);
  });

  it("does not override a portrait the registry already has", () => {
    const registryImage = "https://images.cppserbia.org/speakers/sergei-blinov.png";

    expect(withEventAvatar(lone({ image: registryImage }), AVATAR)[0].image).toBe(registryImage);
  });

  it("skips panels — an avatar keyed by event slug identifies nobody there", () => {
    const panel = [getSpeaker("ivan-cukic")!, getSpeaker("petar-trifunovic")!];

    // Registry portraits may be present; what matters is that none of them picked up
    // the event-slug avatar.
    expect(withEventAvatar(panel, AVATAR).every((s) => s.image !== AVATAR)).toBe(true);
  });

  it("is a no-op when the event has no avatar", () => {
    const speakers = lone();

    expect(withEventAvatar(speakers, undefined)).toBe(speakers);
  });

  it("is a no-op for a community event with no speakers", () => {
    expect(withEventAvatar([], AVATAR)).toEqual([]);
  });
});
