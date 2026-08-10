import type { Event } from "@/lib/events-server";
import { isPastEvent } from "@/lib/temporal";

/**
 * Builds the `performer` node for an Event JSON-LD block, or undefined when the event
 * has no individual speaker.
 *
 * Talks resolve to one or more schema.org Person nodes. Community events (picnics,
 * Beer Wednesdays, lightning celebrations) get no `performer` at all: Google's Event
 * profile accepts only `Person` and `PerformingGroup` there, so naming the community
 * as an Organization would be both ignored and untrue. `performer` is a recommended
 * field, not a required one — omitting beats fabricating.
 */
export function buildPerformer(event: Event) {
  const people = event.speakers.map((speaker) => ({
    "@type": "Person" as const,
    name: speaker.name,
    ...(speaker.url && { url: speaker.url }),
    ...(speaker.sameAs?.length && { sameAs: speaker.sameAs }),
    ...(speaker.image && { image: speaker.image }),
    ...(speaker.bio && { description: speaker.bio }),
    ...(speaker.jobTitle && { jobTitle: speaker.jobTitle }),
    ...(speaker.worksFor && {
      worksFor: { "@type": "Organization" as const, name: speaker.worksFor },
    }),
  }));

  if (people.length === 0) {
    return undefined;
  }

  return people.length === 1 ? people[0] : people;
}

/**
 * Builds the `offers` node for an Event JSON-LD block, or undefined when the event has
 * no registration link or has already happened. All events are free.
 *
 * A past event is not an open offer: the only `availability` values Google accepts are
 * InStock, SoldOut and PreOrder, and none of them describe a meetup that is over. The
 * registration link still belongs on the page — just not as a live `Offer`. Past is the
 * same date-only comparison `getEventsByDate()` uses, so the JSON-LD agrees with the
 * upcoming/past split the site renders.
 *
 * `validFrom` is the `created` frontmatter timestamp — when the Meetup event was
 * created, i.e. when registration opened. Falls back to the event start so the field
 * is never omitted.
 */
export function buildOffers(event: Event, fallbackValidFrom: string) {
  if (!event.registrationLink || isPastEvent(event.date)) {
    return undefined;
  }

  return {
    "@type": "Offer" as const,
    price: "0",
    priceCurrency: "EUR",
    url: event.registrationLink,
    availability: "https://schema.org/InStock",
    validFrom: event.createdAt ?? fallbackValidFrom,
  };
}

/**
 * Generates SEO-optimized keywords for an event based on its content
 */
export function generateEventKeywords(event: Event): string {
  const baseKeywords = [
    "C++",
    "programming",
    "Serbia",
    "Belgrade",
    "meetup",
    "technology",
    "software development",
    "community",
  ];

  const eventSpecificKeywords: string[] = [];

  // Extract keywords from title
  const titleWords = event.title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !["the", "and", "for", "with", "from", "this", "that"].includes(word));

  eventSpecificKeywords.push(...titleWords);

  // Add location-based keywords
  if (event.location.toLowerCase().includes("online")) {
    eventSpecificKeywords.push("online event", "virtual meetup", "remote learning");
  } else {
    eventSpecificKeywords.push("physical event", "in-person meetup");
  }

  // Add keywords based on content
  if (event.content) {
    const content = event.content.toLowerCase();

    // Technical keywords
    const technicalTerms = [
      "template",
      "metaprogramming",
      "coroutines",
      "ranges",
      "concepts",
      "performance",
      "optimization",
      "memory",
      "algorithm",
      "data structures",
      "concurrent",
      "parallel",
      "async",
      "modern cpp",
      "cpp20",
      "cpp23",
      "cmake",
      "vcpkg",
      "debugging",
      "testing",
      "best practices",
    ];

    technicalTerms.forEach((term) => {
      if (content.includes(term)) {
        eventSpecificKeywords.push(term);
      }
    });
  }

  // Combine and deduplicate
  const allKeywords = [...baseKeywords, ...eventSpecificKeywords];
  const uniqueKeywords = Array.from(new Set(allKeywords));

  return uniqueKeywords.join(", ");
}

/**
 * Generates a better description for an event if the original is too short
 */
export function generateEventDescription(event: Event): string {
  if (event.description && event.description.length > 100) {
    return event.description;
  }

  const eventType = event.isOnline ? "online" : "in-person";
  const baseDescription = `Join C++ Serbia community for "${event.title}" - an ${eventType} event`;

  let enhancedDescription = baseDescription;

  if (event.location !== "TBD") {
    enhancedDescription += ` taking place ${event.isOnline ? "online" : `at ${event.location}`}`;
  }

  enhancedDescription += `. Connect with fellow C++ developers, learn about modern C++ techniques, and expand your programming knowledge.`;

  if (event.registrationLink) {
    enhancedDescription += ` Register now to secure your spot!`;
  }

  return enhancedDescription;
}
