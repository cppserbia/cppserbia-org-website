// Central registry of event speakers.
//
// Event markdown files reference an entry by key via the `speaker:` frontmatter field
// (a single key, or a list of keys for panels). The entries feed `performer` in the
// Event JSON-LD (see lib/seo-utils.ts) and the banner/social scripts.
//
// Speakers recur across talks, so keeping them here means enriching a person once
// instead of repeating their links in every event file.
//
// This registry holds only DURABLE identity: name and links. Anything that changes
// over a career — employer, job title — is a property of the event instead, because
// a talk from 2019 should keep saying where the speaker worked in 2019. See
// `EventSpeaker` below and the `speaker:` frontmatter docs in CONTRIBUTING.md.

export interface Speaker {
  /** Display name. The only required field. */
  name: string;
  /** Personal site or primary homepage -> `performer.url`. */
  url?: string;
  /** Profile links (LinkedIn, GitHub, ...) -> `performer.sameAs`. */
  sameAs?: string[];
}

/** A registry entry plus the point-in-time details recorded on one event. */
export interface EventSpeaker extends Speaker {
  /** Employer at the time of this event -> `performer.worksFor`. */
  worksFor?: string;
  /** Role at the time of this event -> `performer.jobTitle`. */
  jobTitle?: string;
}

/**
 * A `speaker:` frontmatter entry: either a bare registry key, or a key with the
 * affiliation the speaker had at that event.
 */
export type SpeakerRef = string | { key: string; worksFor?: string; jobTitle?: string };

export const SPEAKERS = {
  "milos-andjelkovic": {
    name: "Miloš Anđelković",
    sameAs: ["https://www.linkedin.com/in/miloš-anđelković-79952118a/"],
  },
  "goran-arandjelovic": {
    name: "Goran Aranđelović",
    sameAs: ["https://www.linkedin.com/in/goranarandjelovic/"],
  },
  "ivica-bogosavljevic": {
    name: "Ivica Bogosavljević",
    url: "https://johnnysswlab.com/",
    sameAs: ["https://www.linkedin.com/in/ibogi/"],
  },
  "dusan-jovanovic": {
    name: "Dušan Jovanović",
    sameAs: ["https://www.linkedin.com/in/duxi90/"],
  },
  "ivan-cukic": {
    name: "Ivan Čukić",
    sameAs: ["https://rs.linkedin.com/in/ivancukic"],
  },
  "petar-trifunovic": {
    name: "Petar Trifunović",
    sameAs: ["https://www.linkedin.com/in/petar-trifunovic-4453a48a/"],
  },
  "aleksandar-nikolic": {
    name: "Aleksandar Nikolić",
    sameAs: ["https://www.linkedin.com/in/aleksandar-nikolić-61b38779/"],
  },
  "aleksandr-timofeev": {
    name: "Aleksandr Timofeev",
    sameAs: ["https://www.linkedin.com/in/aleksandr-timofeev-982719180/"],
  },
  "aleksandar-smigic": {
    name: "Aleksandar Šmigić",
    sameAs: ["https://www.linkedin.com/in/smiga287"],
  },
  "nebojsa-sabovic": {
    name: "Nebojša Šabović",
    sameAs: ["https://www.linkedin.com/in/nsabovic/"],
  },
  "aleksandar-dakic": {
    name: "Aleksandar Dakić",
    sameAs: ["https://www.linkedin.com/in/aleksandar-dakic/"],
  },
  "nebojsa-koturovic": {
    name: "Nebojša Koturović",
    sameAs: ["https://www.linkedin.com/in/nebojsa-koturovic/"],
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
    sameAs: ["https://www.linkedin.com/in/alexey-ozeritskiy/"],
  },
  "djordje-nedic": {
    name: "Đorđe Nedić",
    sameAs: ["https://www.linkedin.com/in/djordje-nedic"],
  },
  "mirko-arsenijevic": {
    name: "Mirko Arsenijević",
    sameAs: ["https://www.linkedin.com/in/mirko-arsenijevic-5497b2172/"],
  },
  "veljko-tekelerovic": {
    name: "Veljko Tekelerović",
    sameAs: ["https://github.com/vexy"],
  },
  "nikola-jelic": {
    name: "Nikola Jelić",
    sameAs: ["https://www.linkedin.com/in/nikola-jelić-46b89531b/"],
  },
  "djordje-savic": {
    name: "Đorđe Savić",
    sameAs: ["https://www.linkedin.com/in/djordje-savic-63106122/"],
  },
  "marija-aleksic": {
    name: "Marija Aleksić",
    sameAs: ["https://www.linkedin.com/in/aleksicmarija/"],
  },
  "dimitrije-dobrota": {
    name: "Dimitrije Dobrota",
    sameAs: ["https://www.linkedin.com/in/dimitrijedobrota/"],
  },
  "djordje-andjelkovic": {
    name: "Đorđe Anđelković",
    sameAs: ["https://www.linkedin.com/in/djordje-andjelkovic-9b20a9193/"],
  },
  "igor-svilenkov-bozic": {
    name: "Igor Svilenkov Božić",
    sameAs: ["https://www.linkedin.com/in/svilenkov/"],
  },
  "luka-matijevic": {
    name: "Luka Matijević",
    sameAs: ["https://www.linkedin.com/in/luka-matijevic/"],
  },
  "sergei-blinov": {
    name: "Sergei Blinov",
    sameAs: ["https://www.linkedin.com/in/awnion/"],
  },
} as const satisfies Record<string, Speaker>;

export type SpeakerKey = keyof typeof SPEAKERS;

export function getSpeaker(key: string): Speaker | null {
  return (SPEAKERS as Record<string, Speaker>)[key] ?? null;
}

/**
 * Resolve a frontmatter `speaker:` value into registry entries merged with the
 * per-event affiliation. Accepts a bare key, an object with `key` plus `worksFor` /
 * `jobTitle`, or a list mixing both forms.
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
    const { key, worksFor, jobTitle } = typeof ref === "string" ? { key: ref } : ref;
    const speaker = getSpeaker(key);
    if (!speaker) {
      console.warn(`Unknown speaker key "${key}" in event ${slug}`);
      return [];
    }
    return [{ ...speaker, ...(worksFor && { worksFor }), ...(jobTitle && { jobTitle }) }];
  });
}
