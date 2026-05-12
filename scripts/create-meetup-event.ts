import { defineCommand, runMain } from "citty";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { fileURLToPath } from "url";

import { loadEnvFile } from "./load-env";
import { createMeetupClient, MeetupApiError, type MeetupClient } from "./meetup/client";
import { resolveVenueId } from "./meetup/venues";
import type { EventFrontmatter } from "./types";

interface CreatedEvent {
  id: string;
  eventUrl: string;
}

export interface CreateEventPayload {
  groupUrlname: string;
  title: string;
  description: string;
  startDateTime: string;
  duration: string;
  venueId: string;
  publishStatus: "DRAFT";
}

export interface BuildPayloadInput {
  frontmatter: EventFrontmatter & { duration?: string };
  body: string;
  groupUrlname: string;
  resolveVenue?: (name: string) => number;
}

const PLACEHOLDER_RE = /^<.*>$/;

export function isEventAlreadyCreated(event_id: unknown): boolean {
  if (event_id === null || event_id === undefined) return false;
  const s = String(event_id).trim();
  if (s === "") return false;
  if (PLACEHOLDER_RE.test(s)) return false;
  return /^\d+$/.test(s);
}

export function stripLeadingHeading(body: string): string {
  const trimmed = body.replace(/^\s+/, "");
  if (!trimmed.startsWith("# ")) return trimmed;
  const nl = trimmed.indexOf("\n");
  if (nl === -1) return "";
  return trimmed.slice(nl + 1).replace(/^\s+/, "");
}

function naiveIsoString(date: Date): string {
  return date.toISOString().slice(0, 19);
}

export function buildCreateEventPayload(input: BuildPayloadInput): CreateEventPayload {
  const { frontmatter, body, groupUrlname } = input;
  const resolveVenue = input.resolveVenue ?? resolveVenueId;

  if (!frontmatter.title) {
    throw new Error("Event is missing frontmatter `title`.");
  }
  if (!(frontmatter.date instanceof Date) || Number.isNaN(frontmatter.date.getTime())) {
    throw new Error("Event frontmatter `date` is missing or not a valid date.");
  }
  if (!frontmatter.venues || frontmatter.venues.length === 0) {
    throw new Error("Event is missing frontmatter `venues`.");
  }
  if (!frontmatter.duration) {
    throw new Error("Event is missing frontmatter `duration`.");
  }

  return {
    groupUrlname,
    title: frontmatter.title,
    description: stripLeadingHeading(body),
    startDateTime: naiveIsoString(frontmatter.date),
    duration: frontmatter.duration,
    venueId: String(resolveVenue(frontmatter.venues[0])),
    publishStatus: "DRAFT",
  };
}

const CREATE_EVENT_MUTATION = `
  mutation CreateDraftEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      event {
        id
        eventUrl
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

const CREATE_EVENT_PHOTO_MUTATION = `
  mutation CreateEventPhoto($input: GroupEventPhotoCreateInput!) {
    createGroupEventPhoto(input: $input) {
      photo { id }
      uploadUrl
      error { message code field }
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

export function detectContentType(header: string | null | undefined): "JPEG" | "PNG" | "GIF" {
  const normalized = (header ?? "").toLowerCase();
  if (normalized.includes("png")) return "PNG";
  if (normalized.includes("gif")) return "GIF";
  return "JPEG";
}

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

interface GqlErrors {
  errors: Array<{ message: string; code?: string; field?: string }> | null;
}

function formatErrors(errs: GqlErrors["errors"]): string {
  return (errs ?? [])
    .map((e) => `${e.field ?? "?"}: ${e.message}${e.code ? ` (${e.code})` : ""}`)
    .join("; ");
}

async function createEvent(
  client: MeetupClient,
  payload: CreateEventPayload
): Promise<CreatedEvent> {
  const data = await client.graphql<{
    createEvent: { event: CreatedEvent | null } & GqlErrors;
  }>(CREATE_EVENT_MUTATION, { input: payload });

  const result = data.createEvent;
  if (!result.event) {
    const details = formatErrors(result.errors);
    throw new MeetupApiError(
      `createEvent returned no event. ${details || "(no error details)"}`,
      result.errors ?? undefined
    );
  }
  return result.event;
}

async function uploadFeaturedPhoto(
  client: MeetupClient,
  groupId: string,
  eventId: string,
  imageUrl: string
): Promise<void> {
  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) {
    throw new Error(`Failed to fetch image ${imageUrl}: ${imgResp.status}`);
  }
  const contentTypeHeader = imgResp.headers.get("content-type");
  const contentType = detectContentType(contentTypeHeader);
  const buffer = Buffer.from(await imgResp.arrayBuffer());

  const photoResp = await client.graphql<{
    createGroupEventPhoto: {
      photo: { id: string } | null;
      uploadUrl: string | null;
      error: { message: string; code: string; field?: string | null } | null;
    };
  }>(CREATE_EVENT_PHOTO_MUTATION, {
    input: {
      groupId,
      eventId,
      photoType: "EVENT_PHOTO",
      contentType,
      setAsMain: true,
    },
  });

  const { photo, uploadUrl, error } = photoResp.createGroupEventPhoto;
  if (error) {
    throw new MeetupApiError(
      `createGroupEventPhoto failed: ${error.message}${error.code ? ` (${error.code})` : ""}`,
      [{ message: error.message, code: error.code, field: error.field ?? undefined }]
    );
  }
  if (!photo || !uploadUrl) {
    throw new MeetupApiError("createGroupEventPhoto returned no photo or uploadUrl.");
  }

  await client.uploadPhoto(uploadUrl, buffer, contentTypeHeader ?? "image/jpeg");
}

export async function runCreate(eventFile: string, dryRun: boolean): Promise<void> {
  const groupUrlname = process.env.MEETUP_GROUP_URLNAME;
  if (!groupUrlname) {
    throw new Error("Missing MEETUP_GROUP_URLNAME environment variable (e.g. 'cpp-serbia').");
  }

  if (!fs.existsSync(eventFile)) {
    throw new Error(`Event file not found: ${eventFile}`);
  }

  const raw = fs.readFileSync(eventFile, "utf8");
  const parsed = matter(raw);
  const frontmatter = parsed.data as EventFrontmatter & { duration?: string; imageUrl?: string };

  if (isEventAlreadyCreated(frontmatter.event_id)) {
    console.error(
      `[skip] ${eventFile} already has event_id=${frontmatter.event_id}; nothing to do.`
    );
    return;
  }

  const payload = buildCreateEventPayload({
    frontmatter,
    body: parsed.content,
    groupUrlname,
  });

  if (dryRun) {
    console.error(`--- DRY RUN: would create Meetup draft for ${eventFile} ---`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const client = createMeetupClient();
  console.error(`Creating Meetup draft: ${frontmatter.title}`);
  const event = await createEvent(client, payload);
  console.error(`Created draft id=${event.id} url=${event.eventUrl}`);

  if (frontmatter.imageUrl) {
    try {
      console.error(`Uploading featured photo from ${frontmatter.imageUrl}...`);
      const groupId = await getGroupId(client, groupUrlname);
      await uploadFeaturedPhoto(client, groupId, event.id, frontmatter.imageUrl);
      console.error("Photo attached.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[warn] Photo upload failed, continuing without it: ${msg}`);
    }
  }

  parsed.data.event_url = event.eventUrl;
  parsed.data.event_id = event.id;
  fs.writeFileSync(eventFile, matter.stringify(parsed.content, parsed.data));
  console.error(`[updated] ${eventFile} with event_url + event_id`);
}

const main = defineCommand({
  meta: {
    name: "create-meetup-event",
    description: "Create a Meetup.com draft event from an event markdown file.",
  },
  args: {
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Print the CreateEventInput payload without calling the Meetup API.",
    },
    eventFile: {
      type: "positional",
      required: true,
      description: "Path to the event markdown file (e.g. events/YYYY-MM-DD-Title.md).",
    },
  },
  async run({ args }) {
    await runCreate(args.eventFile, Boolean(args["dry-run"]));
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  loadEnvFile();
  runMain(main).then(() => process.exit(0));
}
