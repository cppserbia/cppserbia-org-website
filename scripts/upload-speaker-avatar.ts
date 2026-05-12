import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { defineCommand, runMain } from "citty";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { loadEnvFile } from "./load-env";
import type { EventFrontmatter } from "./types";

const DEFAULT_BUCKET = "cppserbia-images";
const DEFAULT_PUBLIC_BASE = "https://images.cppserbia.org";
const DEFAULT_KEY_PREFIX = "speaker-avatars/";
const AVATAR_SIZE = 750;

// Matches the first image markdown in a comment body, e.g.
//   ![image](https://github.com/user-attachments/assets/<uuid>)
// or a bare HTTP(S) URL pointing at a common image extension. The
// `?:` groups keep the captured URL as group 1 in both branches.
const IMAGE_MARKDOWN_RE = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/;
const BARE_IMAGE_URL_RE =
  /https?:\/\/[^\s)<>"']+\.(?:png|jpe?g|gif|webp|avif|tiff?|bmp)(?:\?[^\s)<>"']*)?/i;

export function extractImageUrl(commentBody: string): string | null {
  const md = commentBody.match(IMAGE_MARKDOWN_RE);
  if (md) return md[1];
  const bare = commentBody.match(BARE_IMAGE_URL_RE);
  if (bare) return bare[0];
  return null;
}

export async function cropToSquare(input: Buffer): Promise<Buffer> {
  const img = sharp(input, { failOn: "none" });
  const meta = await img.metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) {
    throw new Error("Could not read input image dimensions.");
  }
  const size = Math.min(w, h);
  const left = Math.floor((w - size) / 2);
  const top = Math.floor((h - size) / 2);
  return img
    .extract({ left, top, width: size, height: size })
    .resize(AVATAR_SIZE, AVATAR_SIZE)
    .png()
    .toBuffer();
}

interface UploaderEnv {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
  keyPrefix: string;
}

function readEnv(): UploaderEnv {
  loadEnvFile();
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and " +
        "R2_SECRET_ACCESS_KEY in .env or the environment."
    );
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket: process.env.R2_BUCKET ?? DEFAULT_BUCKET,
    publicBase: process.env.R2_PUBLIC_BASE ?? DEFAULT_PUBLIC_BASE,
    keyPrefix: process.env.R2_AVATAR_KEY_PREFIX ?? DEFAULT_KEY_PREFIX,
  };
}

function makeClient(env: UploaderEnv): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
}

async function downloadImage(url: string): Promise<Buffer> {
  // GitHub user-attachment URLs (https://github.com/user-attachments/assets/<uuid>)
  // 302 to a signed CDN URL; auth with GITHUB_TOKEN if present (improves
  // reliability when GitHub later tightens access).
  const headers: Record<string, string> = {
    Accept: "image/*",
    "User-Agent": "cppserbia-banner-bot",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download avatar from ${url}: HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

interface RunOptions {
  eventFile: string;
  commentBodyOrPath: string;
  /** When true, read commentBodyOrPath as a literal string. Otherwise treat it as a file path. */
  literal?: boolean;
  dryRun?: boolean;
}

export async function runUploadAvatar(opts: RunOptions): Promise<{
  imageUrl: string;
  uploadedUrl: string;
  frontmatterChanged: boolean;
}> {
  if (!fs.existsSync(opts.eventFile)) {
    throw new Error(`Event file not found: ${opts.eventFile}`);
  }

  const commentBody = opts.literal
    ? opts.commentBodyOrPath
    : fs.readFileSync(opts.commentBodyOrPath, "utf8");

  const imageUrl = extractImageUrl(commentBody);
  if (!imageUrl) {
    throw new Error(
      "No image URL found in the comment body. Attach an image to the comment " +
        "(drag-and-drop in the GitHub editor) and re-run."
    );
  }

  const env = readEnv();
  const slug = path.basename(opts.eventFile, ".md");
  const keyPrefix = env.keyPrefix.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
  const publicBase = env.publicBase.replace(/\/+$/, "");
  const key = `${keyPrefix}${slug}.png`;
  const publicUrl = `${publicBase}/${key}`;

  console.error(`Downloading avatar from: ${imageUrl}`);
  const raw = await downloadImage(imageUrl);
  console.error(`  ${raw.length} bytes`);

  console.error(`Cropping to ${AVATAR_SIZE}×${AVATAR_SIZE} square (PNG)...`);
  const cropped = await cropToSquare(raw);
  console.error(`  ${cropped.length} bytes after crop+resize+encode`);

  if (opts.dryRun) {
    console.error(`--- DRY RUN: would upload to s3://${env.bucket}/${key} ---`);
    console.error(`            would set frontmatter speaker_avatar=${publicUrl}`);
    return { imageUrl, uploadedUrl: publicUrl, frontmatterChanged: false };
  }

  console.error(`Uploading to s3://${env.bucket}/${key}...`);
  const client = makeClient(env);
  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: key,
      Body: cropped,
      ContentType: "image/png",
      CacheControl: "public, max-age=86400",
    })
  );
  console.error("Upload complete.");

  const raw_md = fs.readFileSync(opts.eventFile, "utf8");
  const parsed = matter(raw_md);
  const previous = (parsed.data as EventFrontmatter & { speaker_avatar?: string }).speaker_avatar;
  let frontmatterChanged = false;
  if (previous !== publicUrl) {
    (parsed.data as EventFrontmatter & { speaker_avatar?: string }).speaker_avatar = publicUrl;
    fs.writeFileSync(opts.eventFile, matter.stringify(parsed.content, parsed.data));
    console.error(`[updated] ${opts.eventFile} speaker_avatar → ${publicUrl}`);
    frontmatterChanged = true;
  } else {
    console.error(`speaker_avatar already set to ${publicUrl}; no frontmatter change.`);
  }

  return { imageUrl, uploadedUrl: publicUrl, frontmatterChanged };
}

const main = defineCommand({
  meta: {
    name: "upload-speaker-avatar",
    description:
      "Download a speaker avatar URL, crop to square, upload to R2, and patch speaker_avatar into the event frontmatter.",
  },
  args: {
    "comment-body-file": {
      type: "string",
      description:
        "Path to a file containing the triggering PR comment's body. Mutually exclusive with --comment-body.",
    },
    "comment-body": {
      type: "string",
      description: "Literal comment body string (alternative to --comment-body-file).",
    },
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Skip the R2 upload and the frontmatter write; print what would happen.",
    },
    eventFile: {
      type: "positional",
      required: true,
      description: "Path to the event markdown file.",
    },
  },
  async run({ args }) {
    const literal = typeof args["comment-body"] === "string";
    const source = literal ? (args["comment-body"] as string) : args["comment-body-file"];
    if (!source) {
      throw new Error("Provide either --comment-body-file <path> or --comment-body <string>.");
    }
    await runUploadAvatar({
      eventFile: args.eventFile as string,
      commentBodyOrPath: source as string,
      literal,
      dryRun: Boolean(args["dry-run"]),
    });
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runMain(main).then(() => process.exit(0));
}
