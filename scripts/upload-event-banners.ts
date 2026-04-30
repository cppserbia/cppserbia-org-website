import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { defineCommand, runMain } from "citty";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { fileURLToPath } from "url";

import { loadEnvFile } from "./load-env";
import type { EventFrontmatter } from "./types";

const DEFAULT_BUCKET = "cppserbia-images";
const DEFAULT_PUBLIC_BASE = "https://images.cppserbia.org";
const DEFAULT_KEY_PREFIX = "events/";

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
    keyPrefix: process.env.R2_KEY_PREFIX ?? DEFAULT_KEY_PREFIX,
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

interface BannerVariant {
  /** Local file path to the JPG. */
  jpgPath: string;
  /** R2 key (e.g. "events/2026-04-29-Cpp-Serbia-Founding-Celebration-3-4.jpg"). */
  key: string;
  /** Public URL after upload. */
  publicUrl: string;
}

export function planVariants(
  slug: string,
  imagesDir: string,
  env: { publicBase: string; keyPrefix: string }
): BannerVariant[] {
  const suffixes = ["", "-3-4", "-9-16"];
  return suffixes.map((suffix) => {
    const file = `${slug}${suffix}.jpg`;
    return {
      jpgPath: path.join(imagesDir, file),
      key: env.keyPrefix + file,
      publicUrl: `${env.publicBase}/${env.keyPrefix}${file}`,
    };
  });
}

async function uploadOne(client: S3Client, bucket: string, variant: BannerVariant): Promise<void> {
  const body = await fs.promises.readFile(variant.jpgPath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: variant.key,
      Body: body,
      ContentType: "image/jpeg",
      // Not immutable — regenerating on PR push would otherwise be invisible
      // to browsers that already cached the previous version. 1 day is plenty
      // for the rare post-merge edit while still cacheable for site visitors.
      CacheControl: "public, max-age=86400",
    })
  );
}

interface RunUploadOptions {
  eventFile: string;
  imagesDir: string;
  dryRun?: boolean;
}

export async function runUpload(opts: RunUploadOptions): Promise<{
  uploaded: BannerVariant[];
  imageUrl: string;
  frontmatterChanged: boolean;
}> {
  const { eventFile, imagesDir, dryRun = false } = opts;

  if (!fs.existsSync(eventFile)) {
    throw new Error(`Event file not found: ${eventFile}`);
  }

  const slug = path.basename(eventFile, ".md");
  const env = readEnv();
  const variants = planVariants(slug, imagesDir, env);

  for (const v of variants) {
    if (!fs.existsSync(v.jpgPath)) {
      throw new Error(
        `Banner not found: ${v.jpgPath}\n  Did you run scripts/generate-event-banner.ts first?`
      );
    }
  }

  if (dryRun) {
    console.error(`--- DRY RUN: would upload ${variants.length} banner(s) for ${slug} ---`);
    for (const v of variants) {
      console.error(`  ${v.jpgPath} → s3://${env.bucket}/${v.key}`);
    }
  } else {
    const client = makeClient(env);
    console.error(`Uploading ${variants.length} banner(s) to s3://${env.bucket}/...`);
    for (const v of variants) {
      console.error(`  ${path.basename(v.jpgPath)} → ${v.key}`);
      await uploadOne(client, env.bucket, v);
    }
    console.error("Upload complete.");
  }

  // Patch frontmatter: imageUrl (horizontal only — others stay at predictable URLs).
  const horizontal = variants[0];
  const raw = fs.readFileSync(eventFile, "utf8");
  const parsed = matter(raw);
  const previousImageUrl = (parsed.data as EventFrontmatter).imageUrl;
  let frontmatterChanged = false;

  if (previousImageUrl !== horizontal.publicUrl) {
    parsed.data.imageUrl = horizontal.publicUrl;
    if (!dryRun) {
      fs.writeFileSync(eventFile, matter.stringify(parsed.content, parsed.data));
      console.error(`[updated] ${eventFile} imageUrl → ${horizontal.publicUrl}`);
    } else {
      console.error(`[dry-run] would set imageUrl → ${horizontal.publicUrl}`);
    }
    frontmatterChanged = true;
  } else {
    console.error(`imageUrl already up to date: ${horizontal.publicUrl}`);
  }

  return {
    uploaded: variants,
    imageUrl: horizontal.publicUrl,
    frontmatterChanged,
  };
}

const main = defineCommand({
  meta: {
    name: "upload-event-banners",
    description:
      "Upload generated event banners to R2 and patch imageUrl into the event frontmatter.",
  },
  args: {
    "images-dir": {
      type: "string",
      default: "images/events",
      description: "Directory containing the generated {slug}.jpg files.",
    },
    "dry-run": {
      type: "boolean",
      default: false,
      description:
        "List planned uploads + frontmatter changes without contacting R2 or writing files.",
    },
    eventFile: {
      type: "positional",
      required: true,
      description: "Path to the event markdown file.",
    },
  },
  async run({ args }) {
    await runUpload({
      eventFile: args.eventFile,
      imagesDir: args["images-dir"],
      dryRun: Boolean(args["dry-run"]),
    });
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runMain(main).then(() => process.exit(0));
}
