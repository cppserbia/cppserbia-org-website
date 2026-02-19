import fs from "fs";
import path from "path";
import matter from "gray-matter";
import jwt from "jsonwebtoken";

const MEETUP_GQL_URL = "https://api.meetup.com/gql-ext";
const MEETUP_TOKEN_URL = "https://secure.meetup.com/oauth2/access";
const EVENTS_DIR = path.join(process.cwd(), "events");
const IMAGES_DIR = path.join(process.cwd(), "images", "events");

// --- Environment variables ---

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const MEETUP_CLIENT_KEY = process.env.MEETUP_CLIENT_KEY;
const MEETUP_MEMBER_ID = process.env.MEETUP_MEMBER_ID;
const MEETUP_PRIVATE_KEY_PATH = process.env.MEETUP_PRIVATE_KEY_PATH;
const MEETUP_SIGNING_KEY_ID = process.env.MEETUP_SIGNING_KEY_ID;

if (
  !MEETUP_CLIENT_KEY ||
  !MEETUP_MEMBER_ID ||
  !MEETUP_PRIVATE_KEY_PATH ||
  !MEETUP_SIGNING_KEY_ID
) {
  console.error("Missing required environment variables.");
  console.error(
    "Set MEETUP_CLIENT_KEY, MEETUP_MEMBER_ID, MEETUP_PRIVATE_KEY_PATH, and MEETUP_SIGNING_KEY_ID."
  );
  console.error("These can be set in the environment or in a .env file.");
  process.exit(1);
}

// --- JWT Bearer OAuth2 flow ---

let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function authenticate(): Promise<string> {
  const privateKey = fs.readFileSync(MEETUP_PRIVATE_KEY_PATH!, "utf8");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: MEETUP_MEMBER_ID,
    iss: MEETUP_CLIENT_KEY,
    aud: "api.meetup.com",
    exp: now + 120,
  };

  const signedJwt = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: {
      alg: "RS256",
      typ: "JWT",
      kid: MEETUP_SIGNING_KEY_ID!,
    },
  });

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: signedJwt,
  });

  const response = await fetch(MEETUP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `OAuth2 token exchange failed: ${response.status} ${response.statusText}\n${text}`
    );
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Token is valid for 1 hour; refresh a bit early
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000;

  console.log("Authenticated with Meetup API.\n");
  return accessToken!;
}

async function getAccessToken(): Promise<string> {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    return authenticate();
  }
  return accessToken;
}

// --- Meetup GraphQL ---

interface EventFrontmatter {
  title: string;
  event_id?: string | number;
  imageUrl?: string;
}

async function fetchMeetupImage(eventId: string): Promise<string | null> {
  const token = await getAccessToken();

  const query = `
    query ($eventId: ID!) {
      event(id: $eventId) {
        featuredEventPhoto {
          id
          baseUrl
        }
      }
    }
  `;

  const response = await fetch(MEETUP_GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables: { eventId },
    }),
  });

  if (!response.ok) {
    console.error(
      `  API error for event ${eventId}: ${response.status} ${response.statusText}`
    );
    return null;
  }

  const data = await response.json();
  const event = data?.data?.event;
  if (!event) {
    console.error(`  No event data returned for ${eventId}`);
    return null;
  }

  const photo = event.featuredEventPhoto;
  if (!photo?.baseUrl || !photo?.id) return null;

  // Construct high-res image URL from baseUrl and photo id
  return `${photo.baseUrl}${photo.id}/highres.webp`;
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
  await authenticate();

  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const files = fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  console.log(`Found ${files.length} event files.\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);

    // Skip if image already exists locally
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

    const imageUrl = await fetchMeetupImage(eventId);
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

    // Small delay to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(
    `\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
