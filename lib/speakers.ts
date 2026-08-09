// Central registry of event speakers.
//
// Event markdown files reference an entry by key via the `speaker:` frontmatter field
// (a single key, or a list of keys for panels). The entries feed `performer` in the
// Event JSON-LD (see lib/seo-utils.ts) and the banner/social scripts.
//
// Speakers recur across talks, so keeping them here means enriching a person once
// instead of repeating their links in every event file.
//
// This registry holds only DURABLE identity: name, links and portrait. Anything that
// changes over a career — employer, job title — is a property of the event instead,
// because a talk from 2019 should keep saying where the speaker worked in 2019. The
// bio lives there too: how a speaker is introduced is written for one talk. See
// `EventSpeaker` below and the `speaker:` frontmatter docs in CONTRIBUTING.md.

export interface Speaker {
  /** Display name. The only required field. */
  name: string;
  /** Personal site or primary homepage -> `performer.url`. */
  url?: string;
  /** Profile links (LinkedIn, GitHub, ...) -> `performer.sameAs`. */
  sameAs?: string[];
  /**
   * Portrait URL -> `performer.image`, and the photo shown on the event page.
   * Durable, so it lives here: a face outlasts the job the person held when they spoke.
   */
  image?: string;
}

/** A registry entry plus the point-in-time details recorded on one event. */
export interface EventSpeaker extends Speaker {
  /** Employer at the time of this event -> `performer.worksFor`. */
  worksFor?: string;
  /** Role at the time of this event -> `performer.jobTitle`. */
  jobTitle?: string;
  /** Short blurb written for this event -> `performer.description`. */
  bio?: string;
}

/**
 * A `speaker:` frontmatter entry: either a bare registry key, or a key with the
 * per-event details: the affiliation the speaker had at that event, and the blurb
 * introducing them for that talk.
 */
export type SpeakerRef =
  | string
  | { key: string; worksFor?: string; jobTitle?: string; bio?: string };

export const SPEAKERS = {
  "milos-andjelkovic": {
    name: "Miloš Anđelković",
    sameAs: ["https://www.linkedin.com/in/miloš-anđelković-79952118a/"],
  },
  "goran-arandjelovic": {
    name: "Goran Aranđelović",
    sameAs: ["https://www.linkedin.com/in/goranarandjelovic/", "https://github.com/bsdgox"],
  },
  "ivica-bogosavljevic": {
    name: "Ivica Bogosavljević",
    url: "https://johnnysswlab.com/",
    sameAs: ["https://www.linkedin.com/in/ibogi/", "https://github.com/ibogosavljevic"],
  },
  "dusan-jovanovic": {
    name: "Dušan Jovanović",
    sameAs: ["https://www.linkedin.com/in/duxi90/", "https://github.com/duxi90"],
  },
  "ivan-cukic": {
    name: "Ivan Čukić",
    url: "https://cukic.co/",
    sameAs: ["https://rs.linkedin.com/in/ivancukic", "https://github.com/ivan-cukic"],
  },
  "petar-trifunovic": {
    name: "Petar Trifunović",
    sameAs: [
      "https://www.linkedin.com/in/petar-trifunovic-4453a48a/",
      "https://github.com/petart95",
    ],
  },
  "aleksandar-nikolic": {
    name: "Aleksandar Nikolić",
    sameAs: [
      "https://www.linkedin.com/in/aleksandar-nikolić-61b38779/",
      "https://github.com/Gillgalard",
    ],
  },
  "aleksandr-timofeev": {
    name: "Aleksandr Timofeev",
    url: "https://hipony.dev/",
    sameAs: [
      "https://www.linkedin.com/in/aleksandr-timofeev-982719180/",
      "https://github.com/Minimonium",
    ],
  },
  "aleksandar-smigic": {
    name: "Aleksandar Šmigić",
    sameAs: ["https://www.linkedin.com/in/smiga287", "https://github.com/smiga287"],
  },
  "nebojsa-sabovic": {
    name: "Nebojša Šabović",
    sameAs: ["https://www.linkedin.com/in/nsabovic/", "https://github.com/nsabovic"],
  },
  "aleksandar-dakic": {
    name: "Aleksandar Dakić",
    sameAs: ["https://www.linkedin.com/in/aleksandar-dakic/"],
  },
  "nebojsa-koturovic": {
    name: "Nebojša Koturović",
    sameAs: ["https://www.linkedin.com/in/nebojsa-koturovic/", "https://github.com/nkoturovic"],
  },
  "slobodan-dmitrovic": {
    name: "Slobodan Dmitrović",
    sameAs: ["https://rs.linkedin.com/in/slobodan-dmitrovic"],
  },
  "nikita-kashkin": {
    name: "Nikita Kashkin",
    sameAs: ["https://www.linkedin.com/in/nikita-kashkin-b2b6b4252/"],
  },
  "alexey-ozeritskiy": {
    name: "Alexey Ozeritskiy",
    sameAs: ["https://www.linkedin.com/in/alexey-ozeritskiy/", "https://github.com/resetius"],
  },
  "djordje-nedic": {
    name: "Đorđe Nedić",
    url: "https://dnedic.github.io/",
    sameAs: ["https://www.linkedin.com/in/djordje-nedic", "https://github.com/DNedic"],
  },
  "mirko-arsenijevic": {
    name: "Mirko Arsenijević",
    sameAs: [
      "https://www.linkedin.com/in/mirko-arsenijevic-5497b2172/",
      "https://github.com/mirko-ars",
    ],
  },
  "veljko-tekelerovic": {
    name: "Veljko Tekelerović",
    sameAs: ["https://github.com/vexy"],
  },
  "nikola-jelic": {
    name: "Nikola Jelić",
    sameAs: [
      "https://www.linkedin.com/in/nikola-jelić-46b89531b/",
      "https://github.com/nikola-jelic",
    ],
  },
  "djordje-savic": {
    name: "Đorđe Savić",
    sameAs: ["https://www.linkedin.com/in/djordje-savic-63106122/"],
  },
  "marija-aleksic": {
    name: "Marija Aleksić",
    sameAs: ["https://www.linkedin.com/in/aleksicmarija/", "https://github.com/aleksicmarija"],
  },
  "dimitrije-dobrota": {
    name: "Dimitrije Dobrota",
    sameAs: [
      "https://www.linkedin.com/in/dimitrijedobrota/",
      "https://github.com/DimitrijeDobrota",
    ],
  },
  "djordje-andjelkovic": {
    name: "Đorđe Anđelković",
    sameAs: [
      "https://www.linkedin.com/in/djordje-andjelkovic-9b20a9193/",
      "https://github.com/dj013",
    ],
  },
  "igor-svilenkov-bozic": {
    name: "Igor Svilenkov Božić",
    sameAs: ["https://www.linkedin.com/in/svilenkov/", "https://github.com/svilenkov"],
  },
  "luka-matijevic": {
    name: "Luka Matijević",
    sameAs: ["https://www.linkedin.com/in/luka-matijevic/"],
  },
  "sergei-blinov": {
    name: "Sergei Blinov",
    sameAs: ["https://www.linkedin.com/in/awnion/", "https://github.com/awnion"],
  },
} as const satisfies Record<string, Speaker>;

export type SpeakerKey = keyof typeof SPEAKERS;

export function getSpeaker(key: string): Speaker | null {
  return (SPEAKERS as Record<string, Speaker>)[key] ?? null;
}

/**
 * Resolve a frontmatter `speaker:` value into registry entries merged with the
 * per-event details. Accepts a bare key, an object with `key` plus `worksFor` /
 * `jobTitle` / `bio`, or a list mixing both forms.
 *
 * Unknown keys are dropped with a warning so typos surface in the build log rather
 * than silently vanishing from the structured data.
 */
export function resolveSpeakers(
  value: SpeakerRef | SpeakerRef[] | undefined,
  slug: string
): EventSpeaker[] {
  if (!value) {
    return [];
  }

  const refs = Array.isArray(value) ? value : [value];

  return refs.flatMap((ref) => {
    const { key, worksFor, jobTitle, bio } = typeof ref === "string" ? { key: ref } : ref;
    const speaker = getSpeaker(key);
    if (!speaker) {
      console.warn(`Unknown speaker key "${key}" in event ${slug}`);
      return [];
    }
    return [
      {
        ...speaker,
        ...(worksFor && { worksFor }),
        ...(jobTitle && { jobTitle }),
        ...(bio && { bio }),
      },
    ];
  });
}

/**
 * Fall back to the event's `speaker_avatar` when a lone speaker has no registry portrait.
 *
 * `speaker_avatar` is uploaded per event (keyed by slug, for the banner) rather than per
 * person, so it only identifies anyone when the event has exactly one speaker. Registry
 * `image` is the real model; this just gets the existing banner portraits onto the page.
 */
export function withEventAvatar(
  speakers: EventSpeaker[],
  avatarUrl: string | undefined
): EventSpeaker[] {
  if (!avatarUrl || speakers.length !== 1 || speakers[0].image) {
    return speakers;
  }
  return [{ ...speakers[0], image: avatarUrl }];
}
