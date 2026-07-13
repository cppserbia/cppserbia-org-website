/**
 * Format a Meetup venue into the `"{name}, {city}, {country}"` key used by
 * `scripts/meetup/venues.ts`. Keys must match the exact string an event file's
 * `venues:` array references, so this is the single source of that formatting.
 */
export function formatVenueKey(v: {
  name: string | null;
  city: string | null;
  country: string | null;
}): string {
  const parts = [v.name, v.city, v.country].filter((p): p is string => !!p && p.length > 0);
  return parts.join(", ");
}
