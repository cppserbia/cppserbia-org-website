import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { defineCommand, runMain } from "citty";

import { loadEnvFile } from "../load-env";
import { buildManifestFromDir } from "./template-cache";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOCAL_DIR = path.join(SCRIPT_DIR, "templates");
const DEFAULT_MANIFEST_PATH = path.join(SCRIPT_DIR, "templates.manifest.json");

interface UploaderEnv {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
  templatePrefix: string;
  sourcePrefix: string;
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
    bucket: process.env.R2_BUCKET ?? "cppserbia-images",
    publicBase: process.env.R2_PUBLIC_BASE ?? "https://images.cppserbia.org",
    templatePrefix: process.env.BANNER_TEMPLATE_PREFIX ?? "banner-templates/v1/",
    sourcePrefix: process.env.BANNER_SOURCE_PREFIX ?? "banner-templates/source/",
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

function contentTypeFor(name: string): string {
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".7z")) return "application/x-7z-compressed";
  return "application/octet-stream";
}

async function putFile(
  client: S3Client,
  bucket: string,
  key: string,
  filePath: string,
  contentType: string
): Promise<void> {
  const body = await fs.readFile(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Templates are versioned via the URL prefix (`v1/`); within a version
      // they should be treated as immutable. Bump the prefix to deploy new
      // designs without invalidating caches.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

interface RunOptions {
  localDir: string;
  manifestPath: string;
  sourceArchive?: string;
  dryRun: boolean;
}

export async function runUploadTemplates(opts: RunOptions): Promise<void> {
  const env = readEnv();

  const stat = await fs.stat(opts.localDir).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error(
      `Templates dir not found: ${opts.localDir}\n  Extract talk_banner.7z into this directory first; see scripts/banner/README.md.`
    );
  }

  console.error(`Building manifest from ${opts.localDir}...`);
  const manifest = await buildManifestFromDir(
    opts.localDir,
    `${env.publicBase}/${env.templatePrefix}`
  );
  if (manifest.files.length === 0) {
    throw new Error(`No files found in ${opts.localDir}.`);
  }

  console.error(`Manifest entries (${manifest.files.length}):`);
  for (const f of manifest.files) {
    console.error(`  ${f.name}  (${(f.bytes / 1024).toFixed(1)} KB)`);
  }

  if (opts.dryRun) {
    console.error("\n--- DRY RUN ---");
    console.error(
      `Would upload ${manifest.files.length} file(s) to s3://${env.bucket}/${env.templatePrefix}`
    );
    if (opts.sourceArchive) {
      console.error(
        `Would upload source archive ${opts.sourceArchive} to s3://${env.bucket}/${env.sourcePrefix}talk_banner.7z`
      );
    }
    console.error(`Would write manifest to ${opts.manifestPath}`);
    return;
  }

  const client = makeClient(env);

  console.error(`\nUploading templates to s3://${env.bucket}/${env.templatePrefix}...`);
  for (const file of manifest.files) {
    const localPath = path.join(opts.localDir, file.name);
    const key = env.templatePrefix + file.name;
    console.error(`  ${file.name} → ${key}`);
    await putFile(client, env.bucket, key, localPath, contentTypeFor(file.name));
  }

  if (opts.sourceArchive) {
    const archiveStat = await fs.stat(opts.sourceArchive).catch(() => null);
    if (!archiveStat?.isFile()) {
      throw new Error(`Source archive not found: ${opts.sourceArchive}`);
    }
    const key = env.sourcePrefix + path.basename(opts.sourceArchive);
    console.error(
      `\nUploading source archive (${(archiveStat.size / 1024 / 1024).toFixed(1)} MB) → ${key}`
    );
    await putFile(client, env.bucket, key, opts.sourceArchive, contentTypeFor(opts.sourceArchive));
  }

  await fs.writeFile(opts.manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.error(`\nWrote ${opts.manifestPath}.`);
  console.error("\nDone. Commit the updated manifest to publish the new template set.");
}

const main = defineCommand({
  meta: {
    name: "upload-templates",
    description:
      "Push extracted SVG templates (and optionally the source 7z) to R2 and refresh the manifest.",
  },
  args: {
    "local-dir": {
      type: "string",
      default: DEFAULT_LOCAL_DIR,
      description: "Local directory containing the extracted templates.",
    },
    "manifest-path": {
      type: "string",
      default: DEFAULT_MANIFEST_PATH,
      description: "Path to write the regenerated manifest JSON.",
    },
    "source-archive": {
      type: "string",
      description:
        "Optional path to talk_banner.7z to also back up under banner-templates/source/.",
    },
    "dry-run": {
      type: "boolean",
      default: false,
      description: "Print planned uploads without contacting R2 or writing files.",
    },
  },
  async run({ args }) {
    await runUploadTemplates({
      localDir: args["local-dir"] as string,
      manifestPath: args["manifest-path"] as string,
      sourceArchive: args["source-archive"] as string | undefined,
      dryRun: Boolean(args["dry-run"]),
    });
  },
});

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runMain(main).then(() => process.exit(0));
}
