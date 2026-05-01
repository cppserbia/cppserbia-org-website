import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface ManifestFile {
  name: string;
  sha256: string;
  bytes: number;
}

interface Manifest {
  version: number;
  publicBaseUrl: string;
  files: ManifestFile[];
}

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(SCRIPT_DIR, "templates.manifest.json");
const DEFAULT_CACHE_DIR = path.join(SCRIPT_DIR, ".template-cache");

let manifestCache: Manifest | null = null;

export async function loadManifest(manifestPath = MANIFEST_PATH): Promise<Manifest> {
  if (!manifestCache) {
    const raw = await fs.readFile(manifestPath, "utf8");
    manifestCache = JSON.parse(raw) as Manifest;
  }
  return manifestCache;
}

async function sha256(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function fileExistsWithHash(filePath: string, expected: string): Promise<boolean> {
  try {
    const actual = await sha256(filePath);
    return actual === expected;
  } catch {
    return false;
  }
}

async function downloadOne(url: string, destPath: string, expectedSha: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  const actual = crypto.createHash("sha256").update(buf).digest("hex");
  if (actual !== expectedSha) {
    throw new Error(
      `Hash mismatch for ${url}: expected ${expectedSha}, got ${actual}. ` +
        `Templates may have been updated without bumping the manifest, or the bucket is serving a stale version.`
    );
  }
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);
}

export interface EnsureOptions {
  cacheDir?: string;
  manifestPath?: string;
}

/**
 * Ensure all banner-template files are present in the cache directory and
 * match the manifest's sha256s. Downloads missing/mismatched files from the
 * manifest's `publicBaseUrl`. Returns the cache dir path so the caller can
 * reference the templates by file name relative to it.
 */
export async function ensureTemplatesCache(opts: EnsureOptions = {}): Promise<string> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const manifest = await loadManifest(opts.manifestPath);

  await fs.mkdir(cacheDir, { recursive: true });

  for (const file of manifest.files) {
    const dest = path.join(cacheDir, file.name);
    if (await fileExistsWithHash(dest, file.sha256)) {
      continue;
    }
    const url = `${manifest.publicBaseUrl}${file.name}`;
    await downloadOne(url, dest, file.sha256);
  }

  return cacheDir;
}

// Exported for the upload-templates script to write a fresh manifest.
export async function buildManifestFromDir(
  dir: string,
  publicBaseUrl: string,
  version = 1
): Promise<Manifest> {
  const entries = (await fs.readdir(dir)).sort();
  const files: ManifestFile[] = [];
  for (const name of entries) {
    const fullPath = path.join(dir, name);
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) continue;
    if (name.startsWith(".") || name === "templates.manifest.json") continue;
    files.push({ name, sha256: await sha256(fullPath), bytes: stat.size });
  }
  return { version, publicBaseUrl, files };
}
