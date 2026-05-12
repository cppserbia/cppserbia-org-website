import { defineCommand, runMain } from "citty";
import path from "path";
import { fileURLToPath } from "url";

import { loadEnvFile } from "../load-env";
import { createMeetupClient, type MeetupClient } from "./client";

interface Venue {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}

interface VenueEdge {
  cursor: string;
  node: Venue;
}

interface VenuesPage {
  edges: VenueEdge[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  totalCount: number;
}

const GROUP_VENUES_QUERY = `
  query GroupVenues($urlname: String!, $first: Int!, $after: String) {
    groupByUrlname(urlname: $urlname) {
      id
      venues(first: $first, after: $after) {
        totalCount
        pageInfo { hasNextPage endCursor }
        edges {
          cursor
          node {
            id
            name
            address
            city
            state
            country
            postalCode
          }
        }
      }
    }
  }
`;

interface GroupVenuesResult {
  groupByUrlname: { id: string; venues: VenuesPage } | null;
}

async function fetchAllVenues(client: MeetupClient, urlname: string): Promise<Venue[]> {
  const venues: Venue[] = [];
  let after: string | null = null;

  for (;;) {
    const data: GroupVenuesResult = await client.graphql<GroupVenuesResult>(GROUP_VENUES_QUERY, {
      urlname,
      first: 50,
      after,
    });

    const group = data.groupByUrlname;
    if (!group) {
      throw new Error(`Meetup group not found: "${urlname}"`);
    }

    for (const edge of group.venues.edges) venues.push(edge.node);

    if (!group.venues.pageInfo.hasNextPage) break;
    after = group.venues.pageInfo.endCursor;
    if (!after) break;
  }

  return venues;
}

function formatVenueKey(v: Venue): string {
  const parts = [v.name, v.city, v.country].filter((p): p is string => !!p && p.length > 0);
  return parts.join(", ");
}

const main = defineCommand({
  meta: {
    name: "list-venues",
    description: "List Meetup venues for the configured group and print TS map entries.",
  },
  args: {
    group: {
      type: "string",
      description: "Group urlname (defaults to MEETUP_GROUP_URLNAME).",
    },
  },
  async run({ args }) {
    const urlname = args.group || process.env.MEETUP_GROUP_URLNAME;
    if (!urlname) {
      console.error(
        "Missing group urlname. Pass --group <slug> or set MEETUP_GROUP_URLNAME in .env."
      );
      process.exit(1);
    }

    const client = createMeetupClient();
    const venues = await fetchAllVenues(client, urlname);

    if (venues.length === 0) {
      console.error(`No venues found for group "${urlname}".`);
      return;
    }

    console.error(`Found ${venues.length} venue(s) for group "${urlname}".\n`);

    console.error("--- Raw venue details ---");
    for (const v of venues) {
      console.error(`  id=${v.id}`);
      console.error(`    name:    ${v.name ?? "(none)"}`);
      console.error(`    address: ${v.address ?? "(none)"}`);
      console.error(`    city:    ${v.city ?? "(none)"} / state: ${v.state ?? "(none)"}`);
      console.error(`    country: ${v.country ?? "(none)"}`);
      console.error("");
    }

    console.error("--- Suggested map entries for scripts/meetup/venues.ts ---");
    console.error(
      "Keys must match the EXACT strings in your event frontmatter 'venues:' arrays.\n" +
        "These are best guesses — verify each against an existing event before committing:\n"
    );
    console.log("export const VENUE_IDS: Record<string, number> = {");
    for (const v of venues) {
      const key = formatVenueKey(v);
      console.log(`  ${JSON.stringify(key)}: ${v.id},`);
    }
    console.log("};");
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  loadEnvFile();
  runMain(main).then(() => process.exit(0));
}
