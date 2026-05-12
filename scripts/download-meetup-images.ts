import fs from "fs";
import matter from "gray-matter";
import path from "path";

import { createMeetupClient, MeetupApiError, type MeetupClient } from "./meetup/client";
import type { EventFrontmatter } from "./types";

const EVENTS_DIR = path.join(process.cwd(), "events");
const IMAGES_DIR = path.join(process.cwd(), "images", "events");

async function fetchMeetupImage(client: MeetupClient, eventId: string): Promise<string | null> {
  try {
    const data = await client.graphql<{
      event: { featuredEventPhoto: { id: string; baseUrl: string } | null } | null;
    }>(
      `query ($eventId: ID!) {
        event(id: $eventId) {
          featuredEventPhoto { id baseUrl }
        }
      }`,
      { eventId }
    );

    const photo = data.event?.featuredEventPhoto;
    if (!photo?.baseUrl || !photo?.id) return null;
    return `${photo.baseUrl}${photo.id}/highres.webp`;
  } catch (err) {
    if (err instanceof MeetupApiError) {
      console.error(`  API error for event ${eventId}: ${err.message}`);
      return null;
    }
    throw err;
  }
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`  Failed to download ${url}: ${response.status}`);
    return false;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  return true;
}

async function main() {
  const client = createMeetupClient();

  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const files = fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  console.log(`Found ${files.length} event files.\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);

    if (fs.existsSync(imagePath)) {
      skipped++;
      continue;
    }

    const content = fs.readFileSync(path.join(EVENTS_DIR, file), "utf8");
    const { data } = matter(content);
    const frontmatter = data as EventFrontmatter;

    if (!frontmatter.event_id) {
      console.log(`[skip] ${slug} — no event_id`);
      skipped++;
      continue;
    }

    const eventId = String(frontmatter.event_id);
    console.log(`[fetch] ${slug} (event_id: ${eventId})`);

    const imageUrl = await fetchMeetupImage(client, eventId);
    if (!imageUrl) {
      console.log(`  No image found.`);
      failed++;
      continue;
    }

    console.log(`  Downloading...`);
    const ok = await downloadImage(imageUrl, imagePath);
    if (ok) {
      console.log(`  Saved to ${imagePath}`);
      downloaded++;
    } else {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
