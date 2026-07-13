import { defineCommand, runMain } from "citty";
import path from "path";
import { fileURLToPath } from "url";

import { loadEnvFile } from "../load-env";
import { createMeetupClient, MeetupApiError, type MeetupClient } from "./client";
import { formatVenueKey } from "./format-venue-key";

/**
 * Create a Meetup venue via the `createVenue` GraphQL mutation and print a
 * ready-to-paste entry for `scripts/meetup/venues.ts`.
 *
 * Meetup geocodes the venue from `address` + `city` + `country`; there is no
 * lat/lon input field. The created venue is attached to `groupId` so it becomes
 * usable by `createEvent` (which only accepts venue IDs Meetup already links to
 * the group). Defaults describe the Inceptive Belgrade office; override any
 * field with the matching flag.
 */

interface CreateVenueInput {
  name: string;
  address: string;
  city: string;
  country: string;
  groupId?: string;
  state?: string;
  visibility?: "GROUP" | "PUBLIC";
}

interface Venue {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  lat: number | null;
  lon: number | null;
}

interface PayloadError {
  message: string;
  code?: string;
  field?: string;
}

interface CreateVenuePayload {
  venue: Venue | null;
  errors: PayloadError[] | null;
  didYouMean: Venue[] | null;
}

const CREATE_VENUE_MUTATION = `
  mutation CreateVenue($input: CreateVenueInput!) {
    createVenue(input: $input) {
      venue {
        id
        name
        address
        city
        state
        country
        postalCode
        lat
        lon
      }
      errors {
        message
        code
        field
      }
      didYouMean {
        id
        name
        address
        city
        country
      }
    }
  }
`;

const GROUP_BY_URLNAME_QUERY = `
  query GetGroupId($urlname: String!) {
    groupByUrlname(urlname: $urlname) {
      id
    }
  }
`;

async function getGroupId(client: MeetupClient, urlname: string): Promise<string> {
  const data = await client.graphql<{ groupByUrlname: { id: string } | null }>(
    GROUP_BY_URLNAME_QUERY,
    { urlname }
  );
  if (!data.groupByUrlname?.id) {
    throw new Error(`Meetup group not found for urlname "${urlname}".`);
  }
  return data.groupByUrlname.id;
}

function formatErrors(errs: PayloadError[] | null): string {
  return (errs ?? [])
    .map((e) => `${e.field ?? "?"}: ${e.message}${e.code ? ` (${e.code})` : ""}`)
    .join("; ");
}

async function createVenue(client: MeetupClient, input: CreateVenueInput): Promise<Venue> {
  const data = await client.graphql<{ createVenue: CreateVenuePayload }>(CREATE_VENUE_MUTATION, {
    input,
  });

  const result = data.createVenue;
  if (!result.venue) {
    const details = formatErrors(result.errors);
    const suggestions = (result.didYouMean ?? [])
      .map((v) => `#${v.id} ${v.name} — ${v.address}, ${v.city}, ${v.country}`)
      .join("\n  ");
    throw new MeetupApiError(
      `createVenue returned no venue. ${details || "(no error details)"}` +
        (suggestions ? `\nDid you mean an existing venue?\n  ${suggestions}` : ""),
      result.errors ?? undefined
    );
  }
  return result.venue;
}

const main = defineCommand({
  meta: {
    name: "create-venue",
    description: "Create a Meetup venue and print a scripts/meetup/venues.ts entry.",
  },
  args: {
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Print the CreateVenueInput payload without calling the Meetup API.",
    },
    name: { type: "string", default: "Inceptive", description: "Venue name." },
    address: {
      type: "string",
      default: "Kneza Višeslava 88",
      description: "Street address (Meetup geocodes from this).",
    },
    city: { type: "string", default: "Beograd", description: "City." },
    country: { type: "string", default: "rs", description: "ISO country code (e.g. 'rs')." },
    state: { type: "string", description: "State/region (optional)." },
    visibility: {
      type: "string",
      default: "PUBLIC",
      description: "Venue visibility: GROUP or PUBLIC.",
    },
    group: {
      type: "string",
      description: "Group urlname to attach the venue to (defaults to MEETUP_GROUP_URLNAME).",
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

    const visibility = String(args.visibility).toUpperCase();
    if (visibility !== "GROUP" && visibility !== "PUBLIC") {
      console.error(`Invalid --visibility "${args.visibility}". Use GROUP or PUBLIC.`);
      process.exit(1);
    }

    const client = createMeetupClient();
    const groupId = await getGroupId(client, urlname);

    const input: CreateVenueInput = {
      name: args.name,
      address: args.address,
      city: args.city,
      country: args.country,
      groupId,
      visibility: visibility as "GROUP" | "PUBLIC",
      ...(args.state ? { state: args.state } : {}),
    };

    if (args["dry-run"]) {
      console.error(`--- DRY RUN: would create Meetup venue on group "${urlname}" ---`);
      console.log(JSON.stringify(input, null, 2));
      return;
    }

    const venue = await createVenue(client, input);
    console.error(`Created venue id=${venue.id}`);
    console.error(`  name:    ${venue.name ?? "(none)"}`);
    console.error(`  address: ${venue.address ?? "(none)"}`);
    console.error(`  city:    ${venue.city ?? "(none)"} / country: ${venue.country ?? "(none)"}`);
    console.error(`  coords:  ${venue.lat ?? "?"}, ${venue.lon ?? "?"}`);
    console.error("\n--- Add this entry to scripts/meetup/venues.ts VENUE_IDS ---");
    console.log(`  ${JSON.stringify(formatVenueKey(venue))}: ${venue.id},`);
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  loadEnvFile();
  runMain(main).then(() => process.exit(0));
}
