/**
 * Map from event frontmatter `venues:` strings to Meetup.com numeric venue IDs.
 *
 * The key MUST be the exact string that appears in an event file's `venues:`
 * array — including quotes, diacritics, and the ", Beograd, rs" suffix Meetup
 * tacks on. When a new venue shows up in an event, add it here; look up its
 * ID via the Meetup organizer dashboard or a `groupByUrlname { pastEvents.venue
 * { id name } }` GraphQL query.
 */
export const VENUE_IDS: Record<string, number> = {
  'Palata "Beograd" ("Beograđanka"), Beograd, rs': 27643714,
  "Docker Brewery & Beer Garden, Beograd, rs": 27548580,
  "ICT Hub Kralja Milana, Beograd, rs": 26122858,
  "Ljubostinjska 2, Beograd, rs": 27293040,
  "Startit Centar, Belgrade, RS": 24183073,
  "United Cloud, Belgrade, rs": 25807437,
  "Kosutnjak, Beograd, yu": 10666282,
};

export function resolveVenueId(venueName: string, map: Record<string, number> = VENUE_IDS): number {
  if (!(venueName in map)) {
    const known = Object.keys(map);
    const keys =
      known.length === 0
        ? "  (none yet — populate scripts/meetup/venues.ts)"
        : known.map((k) => `  - ${JSON.stringify(k)}`).join("\n");
    throw new Error(
      `Unknown venue ${JSON.stringify(venueName)}. ` +
        `Add it to scripts/meetup/venues.ts.\nKnown venues:\n${keys}`
    );
  }
  const id = map[venueName];
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(
      `Venue ${JSON.stringify(venueName)} is registered in scripts/meetup/venues.ts but has a ` +
        `placeholder ID (${id}). Replace it with the real Meetup venue ID.`
    );
  }
  return id;
}
