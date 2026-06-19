# Image Hosting Setup

End-to-end guide for setting up event image hosting on Cloudflare R2 and populating it with images from Meetup.com.

## Prerequisites

| Tool                                                           | Install                                     |
| -------------------------------------------------------------- | ------------------------------------------- |
| [Terraform](https://developer.hashicorp.com/terraform/install) | `brew install terraform`                    |
| [rclone](https://rclone.org/install/)                          | `brew install rclone`                       |
| [tsx](https://github.com/privatenumber/tsx)                    | Already in devDependencies (`pnpm install`) |

You'll also need:

- A **Cloudflare account** with the `cppserbia.org` zone
- A **Cloudflare API token** with R2 + DNS edit permissions
- R2 **Access Key ID** and **Secret Access Key** (for rclone)
- A **Meetup.com OAuth app** with JWT Bearer (RS256) signing key (see Step 2)

---

## Step 1 — Create the R2 Bucket (Terraform)

### 1.1 Get your Cloudflare IDs

Go to the [Cloudflare dashboard](https://dash.cloudflare.com/):

- **Account ID** — visible in the right sidebar on any zone's Overview page
- **Zone ID** — visible on the `cppserbia.org` Overview page
- **API Token** — create one at _My Profile → API Tokens → Create Token_
  - Permissions needed: `Account / R2 / Edit` + `Zone / DNS / Edit`

### 1.2 Create a tfvars file

```bash
cat > infra/terraform.tfvars <<'EOF'
cloudflare_account_id = "your-account-id"
cloudflare_api_token  = "your-api-token"
zone_id               = "your-zone-id"
EOF
```

> This file is gitignored — never commit it.

### 1.3 Init and apply

```bash
cd infra
terraform init
terraform plan     # Review what will be created
terraform apply    # Type "yes" to confirm
```

This creates:

- An R2 bucket named `cppserbia-images` (Eastern Europe region)
- A custom domain binding for `images.cppserbia.org` with public access enabled

Files will be publicly accessible at `https://images.cppserbia.org/events/{slug}.jpg`.

---

## Step 2 — Download Images from Meetup.com

**Meetup API setup** (OAuth app, signing key, env vars) lives in [`meetup/README.md`](./meetup/README.md). Complete that once, then come back here.

Run the downloader:

```bash
npx tsx scripts/download-meetup-images.ts
```

The script reads every event `.md` in `/events/`, queries the Meetup GraphQL API for each event with an `event_id`, downloads missing banners to `images/events/{slug}.jpg`, and skips events that already have a local image.

Output looks like:

```
Found 50 event files.

[skip] 2016-12-08-Prvo-okupljanje-Cpp-user-grupe — no event_id
[fetch] 2024-09-18-World-of-Bitcoin-open-sourced-Cpp-project (event_id: 303123456)
  Downloading...
  Saved to images/events/2024-09-18-World-of-Bitcoin-open-sourced-Cpp-project.jpg

Done: 35 downloaded, 12 skipped, 3 failed.
```

---

## Step 3 — Sync Images to R2

### 3.1 Configure rclone

Run the interactive config:

```bash
rclone config
```

| Prompt               | Value                                                                              |
| -------------------- | ---------------------------------------------------------------------------------- |
| `n/s/q>`             | `n` (new remote)                                                                   |
| `name>`              | `r2`                                                                               |
| `Storage>`           | `s3` (Amazon S3 Compliant)                                                         |
| `provider>`          | `Cloudflare`                                                                       |
| `access_key_id>`     | _(from Cloudflare R2 dashboard → Manage API Tokens → Create API Token → R2 Token)_ |
| `secret_access_key>` | _(same page)_                                                                      |
| `endpoint>`          | `https://<account_id>.r2.cloudflarestorage.com`                                    |

Accept defaults for everything else. Verify it works:

```bash
rclone lsd r2:              # Should list your buckets
rclone ls r2:cppserbia-images   # Should be empty initially
```

### 3.2 Upload images

```bash
./scripts/sync-images.sh upload
```

This runs `rclone sync` from `images/events/` to `r2:cppserbia-images/events/`.

Verify images are accessible:

```bash
curl -I https://images.cppserbia.org/events/2026-01-28-what-is-going-on-with-contracts.jpg
# Should return 200 OK
```

---

## Step 4 — Update Event Frontmatter

Once images are uploaded to R2, update the event markdown files to reference them:

```bash
npx tsx scripts/update-event-images.ts
```

The script will:

- Scan `images/events/` for downloaded images
- For each image, find the matching event `.md` file by slug
- Add `imageUrl: https://images.cppserbia.org/events/{slug}.jpg` to the frontmatter
- Skip events that already have an `imageUrl` set

After running, verify locally:

```bash
pnpm dev
# Open an event page — the banner image should render
```

Then commit the updated event files:

```bash
git diff events/   # Review the imageUrl additions
git add events/
git commit -m "Add imageUrl to event frontmatter"
```

---

## Quick Reference

```bash
# Full pipeline (after initial setup — env vars in .env or exported)
npx tsx scripts/download-meetup-images.ts
./scripts/sync-images.sh upload
npx tsx scripts/update-event-images.ts
```

## Adding Images for New Events

When adding a new event, you have two options:

1. **If the event is on Meetup** — re-run the download script, then sync and update
2. **Manual** — place the image in `images/events/{slug}.jpg`, run upload + update, or just set `imageUrl` directly in the frontmatter

---

## Creating Meetup Draft Events

Meetup.com **Draft** event creation is handled by our published Marketplace action [`cppserbia/coopkit-meetup-action`](https://github.com/cppserbia/coopkit-meetup-action) (which wraps the [`@coopkit/meetup`](https://www.npmjs.com/package/@coopkit/meetup) package), driven by `.github/workflows/meetup-event-draft.yml` on the `meetup-event` PR label. Group + venue config lives in `coopkit.config.json`; the repo-specific frontmatter↔action glue (no Meetup API code) is `scripts/meetup-pr-event.ts`. Discover venue IDs with `bunx coopkit-meetup list-venues`. OAuth scopes, env vars, and troubleshooting: [`@coopkit/meetup` README](https://github.com/cppserbia/coopkit/blob/main/packages/meetup/README.md).

---

## Generating Event Banners

For new events authored in this repo, the **banner pipeline** generates three banner formats (horizontal + 3:4 + 9:16) directly from the event markdown frontmatter, uploads them to R2, and patches `imageUrl` into the event file. This replaces the manual download-from-Meetup path for new events.

- `scripts/generate-event-banner.ts` — port of `cppserbia-org/branding/event_banners/` to TypeScript. Calls Inkscape under the hood for SVG → PNG export and text-width measurement.
- `scripts/upload-event-banners.ts` — uploads the three JPGs to R2 via `@aws-sdk/client-s3`, patches `imageUrl`.
- `.github/workflows/generate-event-image.yml` — runs both on every PR push that touches `events/**.md`.

Local Inkscape: `brew install inkscape` (macOS) or `apt-get install inkscape` (Linux). Full setup, env vars, and template-refresh procedure: [`banner/README.md`](./banner/README.md).
