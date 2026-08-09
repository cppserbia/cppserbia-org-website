import { Github, Globe, Linkedin } from "lucide-react";
import Image from "next/image";
import { Fragment } from "react";

import type { EventSpeaker } from "@/lib/speakers";
import { cn } from "@/lib/utils";

/**
 * Role and employer, the way a person introduces themselves:
 * `Forward Deployed Engineer, web3mine`.
 *
 * Either field may be missing — an event often records only one — so a lone field
 * is rendered on its own rather than with a dangling comma.
 */
export function formatAffiliation(speaker: EventSpeaker): string | null {
  if (speaker.jobTitle && speaker.worksFor) {
    return `${speaker.jobTitle}, ${speaker.worksFor}`;
  }
  return speaker.jobTitle ?? speaker.worksFor ?? null;
}

/** Every distinct link for a speaker, homepage first. */
function speakerLinks(speaker: EventSpeaker): string[] {
  return [...new Set([speaker.url, ...(speaker.sameAs ?? [])].filter(Boolean) as string[])];
}

/** The link the speaker's name points to when only one link fits. */
function primaryLink(speaker: EventSpeaker): string | undefined {
  return speakerLinks(speaker)[0];
}

/** Icon and accessible name for a link, chosen by host. */
function describeLink(url: string): { Icon: typeof Linkedin; platform: string } {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // Malformed URLs still get a link, just the generic icon.
  }

  if (host.endsWith("linkedin.com")) return { Icon: Linkedin, platform: "LinkedIn" };
  if (host.endsWith("github.com")) return { Icon: Github, platform: "GitHub" };
  // Hostname doubles as the accessible name: honest, and needs no translation.
  return { Icon: Globe, platform: host || "website" };
}

/**
 * One line under the event title naming who is speaking.
 *
 * Deliberately not a fourth `chip-glass` — the chips carry when and where, and a
 * person is not that class of fact. A panel drops affiliations, which would swamp
 * the hero at four speakers.
 */
export function SpeakerByline({ speakers }: { speakers: EventSpeaker[] }) {
  if (speakers.length === 0) {
    return null;
  }

  const affiliation = speakers.length === 1 ? formatAffiliation(speakers[0]) : null;

  return (
    <p className="-mt-3 mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-gray-200 md:text-base">
      {speakers.map((speaker, index) => {
        const href = primaryLink(speaker);
        return (
          <Fragment key={speaker.name}>
            {index > 0 && (
              <span className="text-gray-500" aria-hidden="true">
                &middot;
              </span>
            )}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm font-medium text-white underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                {speaker.name}
              </a>
            ) : (
              <span className="font-medium text-white">{speaker.name}</span>
            )}
          </Fragment>
        );
      })}

      {affiliation && (
        <>
          <span className="text-gray-500" aria-hidden="true">
            &middot;
          </span>
          <span className="text-sm text-gray-400">{affiliation}</span>
        </>
      )}
    </p>
  );
}

/**
 * The speaker block closing the article: portrait, name, affiliation, bio, links.
 *
 * Portraits are all-or-nothing. A row mixing photographs with initial-blobs reads as
 * ragged, and the text-only layout stands on its own, so the image column appears
 * only when every speaker on the event has one.
 */
export function SpeakerBlock({ speakers, label }: { speakers: EventSpeaker[]; label: string }) {
  if (speakers.length === 0) {
    return null;
  }

  const showPortraits = speakers.every((speaker) => speaker.image);
  const isPanel = speakers.length > 1;
  const portraitSize = isPanel ? 56 : 72;

  return (
    <section className="mt-12">
      <div className="divider-gradient-subtle mb-8" />
      <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-gray-500">{label}</h2>

      <ul className={cn("grid list-none gap-8 p-0", isPanel && "sm:grid-cols-2")}>
        {speakers.map((speaker) => {
          const affiliation = formatAffiliation(speaker);
          const links = speakerLinks(speaker);

          return (
            <li key={speaker.name} className="flex gap-4">
              {showPortraits && (
                <Image
                  // Square frame at the shared radius: the source crops are square, and a
                  // circle here would be the reflex rather than a choice.
                  src={speaker.image as string}
                  alt=""
                  width={portraitSize}
                  height={portraitSize}
                  className={cn(
                    "flex-shrink-0 rounded-lg border border-purple-900/60 object-cover",
                    isPanel ? "h-14 w-14" : "h-[72px] w-[72px]"
                  )}
                />
              )}

              <div className="min-w-0">
                <p className="font-semibold text-white">{speaker.name}</p>

                {affiliation && <p className="mt-0.5 text-sm text-gray-400">{affiliation}</p>}

                {speaker.bio && (
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{speaker.bio}</p>
                )}

                {links.length > 0 && (
                  <div className="mt-3 flex items-center gap-3">
                    {links.map((href) => {
                      const { Icon, platform } = describeLink(href);
                      return (
                        <a
                          key={href}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${speaker.name} · ${platform}`}
                          className="rounded-sm text-gray-300 transition-colors hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                        >
                          <Icon className="h-[18px] w-[18px]" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
