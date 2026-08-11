import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { formatAffiliation, SpeakerBlock, SpeakerByline } from "@/components/event-speakers";
import type { EventSpeaker } from "@/lib/speakers";

// vitest runs without `globals`, so RTL's automatic cleanup never registers and
// each render would otherwise pile onto the previous test's DOM.
afterEach(cleanup);

const sergei: EventSpeaker = {
  name: "Sergei Blinov",
  sameAs: ["https://www.linkedin.com/in/awnion/"],
  worksFor: "web3mine",
  jobTitle: "Forward Deployed Engineer",
  bio: "Sergei Blinov is an FDE @ web3mine and a math enthusiast.",
};

const ivica: EventSpeaker = {
  name: "Ivica Bogosavljević",
  url: "https://johnnysswlab.com/",
  sameAs: ["https://www.linkedin.com/in/ibogi/"],
};

const href = (name: string) => screen.getByRole("link", { name }).getAttribute("href");

describe("formatAffiliation", () => {
  it("reads role first, then employer", () => {
    expect(formatAffiliation(sergei)).toBe("Forward Deployed Engineer, web3mine");
  });

  it("renders a lone field without a dangling comma", () => {
    expect(formatAffiliation({ name: "X", worksFor: "KDAB" })).toBe("KDAB");
    expect(formatAffiliation({ name: "X", jobTitle: "Researcher" })).toBe("Researcher");
  });

  it("is null when the event recorded no affiliation", () => {
    expect(formatAffiliation({ name: "X" })).toBeNull();
  });
});

describe("SpeakerByline", () => {
  it("names the speaker and links to their profile", () => {
    render(<SpeakerByline speakers={[sergei]} />);

    expect(href("Sergei Blinov")).toBe("https://www.linkedin.com/in/awnion/");
    expect(screen.getByText("Forward Deployed Engineer, web3mine")).toBeTruthy();
  });

  it("prefers a personal site over a profile link", () => {
    render(<SpeakerByline speakers={[ivica]} />);

    expect(href("Ivica Bogosavljević")).toBe("https://johnnysswlab.com/");
  });

  it("drops affiliations on a panel, which would swamp the hero", () => {
    render(<SpeakerByline speakers={[sergei, ivica]} />);

    expect(screen.getByText("Sergei Blinov")).toBeTruthy();
    expect(screen.getByText("Ivica Bogosavljević")).toBeTruthy();
    expect(screen.queryByText(/Forward Deployed Engineer/)).toBeNull();
  });

  it("renders nothing for a community event", () => {
    const { container } = render(<SpeakerByline speakers={[]} />);

    expect(container.innerHTML).toBe("");
  });
});

describe("SpeakerBlock", () => {
  it("shows name, affiliation, bio and one link per profile", () => {
    render(<SpeakerBlock speakers={[sergei]} label="Speaker" />);

    expect(screen.getByRole("heading", { name: "Speaker" })).toBeTruthy();
    expect(screen.getByText("Sergei Blinov")).toBeTruthy();
    expect(screen.getByText("Forward Deployed Engineer, web3mine")).toBeTruthy();
    expect(screen.getByText(sergei.bio!)).toBeTruthy();
    expect(href("Sergei Blinov · LinkedIn")).toBe("https://www.linkedin.com/in/awnion/");
  });

  it("labels each link by platform, hostname for anything else", () => {
    render(<SpeakerBlock speakers={[ivica]} label="Speaker" />);

    expect(href("Ivica Bogosavljević · johnnysswlab.com")).toBe("https://johnnysswlab.com/");
    expect(href("Ivica Bogosavljević · LinkedIn")).toBe("https://www.linkedin.com/in/ibogi/");
  });

  it("shows portraits only when every speaker has one", () => {
    const withPhoto = { ...sergei, image: "https://images.cppserbia.org/speakers/sergei.png" };

    const solo = render(<SpeakerBlock speakers={[withPhoto]} label="Speaker" />);
    expect(solo.container.querySelector("img")).not.toBeNull();
    solo.unmount();

    // One of two has a portrait — a mixed row reads as ragged, so neither shows.
    const mixed = render(<SpeakerBlock speakers={[withPhoto, ivica]} label="Speakers" />);
    expect(mixed.container.querySelector("img")).toBeNull();
  });

  it("renders nothing for a community event", () => {
    const { container } = render(<SpeakerBlock speakers={[]} label="Speaker" />);

    expect(container.innerHTML).toBe("");
  });
});
