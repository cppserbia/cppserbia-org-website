# Event Banner Generation

TypeScript port of the SVG-based event-banner pipeline that lived in `cppserbia-org/branding/event_banners/`. Produces three formats per event — horizontal `1920×1080` (Meetup featured photo + site hero), vertical 3:4 `1440×1920` (IG post), and vertical 9:16 `1080×1920` (IG/TikTok story).

The pipeline is invoked automatically by [`.github/workflows/generate-event-image.yml`](../../.github/workflows/generate-event-image.yml) when an event file changes inside a PR. The workflow generates the banners, uploads them to R2, patches `imageUrl` into the event frontmatter, and commits the change back to the PR branch.

## What's here

| File                      | Purpose                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `text-fit.ts`             | Pure binary-search font-size fitter (no Inkscape dependency at the unit-test level)               |
| `svg-template.ts`         | linkedom-based XML mutation: `setText`, `setFontSize`, `clearText`                                |
| `inkscape.ts`             | Subprocess wrapper around the `inkscape` CLI: `queryWidth`, `exportPng`, `isAvailable`            |
| `template-cache.ts`       | On-demand downloader: fetches templates from R2 into `.template-cache/`, sha256-verified          |
| `templates.manifest.json` | Committed manifest: lists template filenames, sha256s, and the public R2 base URL                 |
| `generate.ts`             | Orchestrator: ensure cache → load template → mutate text → fit fonts → export PNG → JPEG-compress |
| `upload-templates.ts`     | One-shot pusher: uploads a local `templates/` dir to R2 and regenerates the manifest              |

Top-level consumers in `scripts/`:

- [`../generate-event-banner.ts`](../generate-event-banner.ts) — CLI entry; reads event frontmatter + body, builds the banner input, writes the three JPGs.
- [`../upload-event-banners.ts`](../upload-event-banners.ts) — uploads the three JPGs to R2 and patches `imageUrl` into the event frontmatter.

---

## Local setup

### Inkscape

Required to render SVG → PNG and to measure text widths during font-fitting.

- macOS: `brew install inkscape`
- Linux: `sudo apt-get install inkscape`

If installed somewhere unusual, set `INKSCAPE_BIN` in the environment.

### R2 credentials (only needed for upload)

Add to `.env` (the file is gitignored):

```bash
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
# Optional overrides:
# R2_BUCKET=cppserbia-images
# R2_PUBLIC_BASE=https://images.cppserbia.org
# R2_KEY_PREFIX=events/
```

These are the same R2 credentials used by `rclone` for the existing image pipeline; reuse them.

---

## Running locally

```bash
# Generate the three banners (writes images/events/{slug}{,-3-4,-9-16}.jpg)
npx tsx scripts/generate-event-banner.ts events/2026-04-29-Cpp-Serbia-Founding-Celebration.md

# Upload them to R2 and patch imageUrl into the frontmatter
npx tsx scripts/upload-event-banners.ts events/2026-04-29-Cpp-Serbia-Founding-Celebration.md

# Dry-run the upload step (no R2 calls, no file writes)
npx tsx scripts/upload-event-banners.ts --dry-run events/2026-04-29-Cpp-Serbia-Founding-Celebration.md
```

The CI workflow runs the same two scripts in sequence on every PR push that touches `events/**.md`.

---

## How the banner is built

1. Load the SVG template for the format.
2. Set the date text into `text_field_date`.
3. Set the speaker. Horizontal templates use a single `text_field_author`; vertical templates split into `text_field_author_1` (first name) + `text_field_author_2` (surname). The split happens on the **last** whitespace.
4. Set up to N title lines into `text_field_1` … `text_field_N` (N = 3 horizontal, 5 vertical).
5. For each text field, query its sibling `*_hint` element's width once (it's a fixed bounding box in the template), then binary-search for the largest font size at which the rendered text fits inside that box.
6. Take the **minimum** optimal size across all title fields and apply it to all of them — gives uniform sizing if one line is longer than the others.
7. Clear unused text fields.
8. Export the `talk_announcement_background` layer to PNG via Inkscape at the format's pixel dimensions.
9. Convert PNG → JPEG via `sharp` (mozjpeg, quality 85) for smaller R2 footprint.

### Speaker resolution

The CLI looks for the speaker in this order:

1. `frontmatter.banner_author` (if set in the event file's frontmatter; useful for community events without a single speaker, e.g. `banner_author: "@ Docker Brewery"`).
2. The Event Details table in the body, via `extractSpeakerName` from `scripts/social/extract.ts`.
3. Fallback: `"C++ Serbia"`.

### Speaker avatar

By default every banner shows the fixed `avatar.png` placeholder from the templates bundle. To use a real speaker portrait per event, set `speaker_avatar:` in the event frontmatter to an image URL. The generator downloads it once per format invocation and rewrites the SVG's `xlink:href="avatar.png"` reference to point at the downloaded file before invoking Inkscape.

The easiest way to populate `speaker_avatar` is the `/banner-avatar` slash command — drag a photo into a PR comment, type `/banner-avatar`, and the bot crops it to a 750×750 PNG, uploads it to R2 at `speaker-avatars/{slug}.png`, and commits the URL back. See `scripts/upload-speaker-avatar.ts` and `.github/workflows/banner-avatar.yml`.

### Title line splitting

The frontmatter `title` is a single string. The CLI greedy-packs words into lines using a target characters-per-line budget that depends on format (28 horizontal, 18 vertical), capped at the format's max line count. Overflow words collapse into the last line and the binary-search font fitter shrinks the result. If you want a specific break, simplest workaround is shortening the title.

---

## Where the templates live

Templates are **not** committed to this repo. They live in R2 under `banner-templates/v1/`, served at:

```
https://images.cppserbia.org/banner-templates/v1/
  ├── talk_banner_horizontal.svg
  ├── talk_banner_vertical_3_4.svg
  ├── talk_banner_vertical_9_16.svg
  ├── avatar.png
  └── asset-<sha>.png        (the shared design background)
```

The committed `templates.manifest.json` lists every expected file with its sha256 and the public base URL. At runtime, `generate.ts` calls `ensureTemplatesCache()`, which:

1. Reads the manifest.
2. For each entry, checks `scripts/banner/.template-cache/<name>` against the expected hash.
3. Downloads anything missing or mismatched from `${publicBaseUrl}<name>`.

The cache dir is gitignored and persists across local runs. CI caches it via `actions/cache` keyed on the manifest hash, so the ~17 MB only re-downloads when the manifest actually changes.

The R2 bucket is publicly readable, so the runtime download needs no credentials. Only the **upload** path needs R2 keys.

## Refreshing templates (designer / admin path)

When the design changes, the source-of-truth is `cppserbia-org/branding/event_banners/talk_banner.7z`. A backup of that archive is also kept in R2 at `banner-templates/source/talk_banner.7z`.

```bash
# 1. Extract the archive somewhere outside this repo:
mkdir -p /tmp/banner-extract && cd /tmp/banner-extract
7zz x /path/to/talk_banner.7z

# 2. The raw SVGs are ~165 MB each because Inkscape embeds the same large
# raster asset 7 times per file as base64. Externalize those into a shared
# file and rewrite the hrefs to relative paths:
mkdir -p <repo>/scripts/banner/templates
cd <repo>
node -e '
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const SRC = "/tmp/banner-extract";
const DST = "scripts/banner/templates";
const assets = new Map();
for (const f of ["talk_banner_horizontal.svg", "talk_banner_vertical_3_4.svg", "talk_banner_vertical_9_16.svg"]) {
  let svg = fs.readFileSync(path.join(SRC, f), "utf8");
  svg = svg.replace(/xlink:href="data:image\/([^;]+);base64,([^"]+)"/g, (_, ext, b64) => {
    const buf = Buffer.from(b64, "base64");
    const sha = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
    let entry = assets.get(sha);
    if (!entry) {
      entry = { filename: `asset-${sha}.${ext}` };
      fs.writeFileSync(path.join(DST, entry.filename), buf);
      assets.set(sha, entry);
    }
    return `xlink:href="${entry.filename}"`;
  });
  fs.writeFileSync(path.join(DST, f), svg);
}
'

# 3. Copy the avatar (placeholder used by all formats):
cp /path/to/branding/event_banners/avatar.png scripts/banner/templates/avatar.png

# 4. Push everything to R2 (uploads templates AND backs up the source archive):
npx tsx scripts/banner/upload-templates.ts \
  --source-archive /path/to/branding/event_banners/talk_banner.7z

# 5. Commit the regenerated templates.manifest.json. That's the only change
# that lands in git. The bucket now serves the new templates; the next CI
# run will see the new manifest hash, miss the cache, and download.
```

The `--source-archive` flag is optional; skip it if you've already pushed the matching `.7z` once. Bump `BANNER_TEMPLATE_PREFIX` (default `banner-templates/v1/`) to deploy a new design without invalidating cached old generations.

---

## Troubleshooting

| Symptom                                                          | Likely cause                                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Inkscape binary not found at "inkscape"`                        | Install Inkscape (`brew install inkscape` / `apt-get install inkscape`) or set `INKSCAPE_BIN`.                                        |
| `Inkscape returned non-numeric width for id="text_field_X"`      | The template SVG no longer has that element id, or Inkscape is too old. Verify with `grep 'id="text_field_' templates/*.svg`.         |
| `Banner not found: …` (during upload)                            | Run `generate-event-banner.ts` first, or pass `--images-dir` pointing at the right place.                                             |
| `Missing R2 credentials`                                         | Set the `R2_*` env vars in `.env` or the shell environment.                                                                           |
| Banner regenerated but the public URL still serves the old image | `Cache-Control: max-age=86400` — the previous version is cached for up to a day at the CDN edge. Wait it out, or hard-reload locally. |
