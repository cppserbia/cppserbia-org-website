# Image Hosting Setup

End-to-end guide for setting up event image hosting on Cloudflare R2 and populating it with images from Meetup.com.

## Prerequisites

| Tool | Install |
|------|---------|
| [Terraform](https://developer.hashicorp.com/terraform/install) | `brew install terraform` |
| [rclone](https://rclone.org/install/) | `brew install rclone` |
| [tsx](https://github.com/privatenumber/tsx) | Already in devDependencies (`pnpm install`) |

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
- **API Token** — create one at *My Profile → API Tokens → Create Token*
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

### 2.1 Create a Meetup OAuth app

1. Go to [Meetup OAuth App Creation](https://www.meetup.com/api/oauth/create/)
2. Fill in the app details (name, redirect URI — any valid URL is fine for JWT Bearer flow)
3. After creating, note the **Consumer Key** (this is your `MEETUP_CLIENT_KEY`)

### 2.2 Generate an RSA signing key

In your OAuth app settings on Meetup:

1. Go to the **JWT Signing Keys** section
2. Click **Generate Key** — Meetup will create an RSA key pair
3. Download the **private key** PEM file and save it (e.g., `meetup-private-key.pem`)
4. Note the **Key ID** shown in the dashboard (this is your `MEETUP_SIGNING_KEY_ID`)

> Keep the private key file safe and never commit it to version control. It is gitignored by default (`*.pem`).

### 2.3 Find your Meetup member ID

Your member ID is visible in your Meetup profile URL or via the API. This is the `MEETUP_MEMBER_ID` value.

### 2.4 Set environment variables

Create a `.env` file in the project root (it is gitignored):

```bash
MEETUP_CLIENT_KEY=your-consumer-key
MEETUP_MEMBER_ID=your-member-id
MEETUP_PRIVATE_KEY_PATH=./meetup-private-key.pem
MEETUP_SIGNING_KEY_ID=your-key-id
```

Or export them in your shell:

```bash
export MEETUP_CLIENT_KEY="your-consumer-key"
export MEETUP_MEMBER_ID="your-member-id"
export MEETUP_PRIVATE_KEY_PATH="./meetup-private-key.pem"
export MEETUP_SIGNING_KEY_ID="your-key-id"
```

### 2.5 Run the download script

```bash
npx tsx scripts/download-meetup-images.ts
```

The script will:
- Read all event `.md` files in `/events/`
- For each event with an `event_id` in its frontmatter, query the Meetup GraphQL API for its banner image
- Download images to `images/events/{slug}.jpg`
- Skip events that already have a local image

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

| Prompt | Value |
|--------|-------|
| `n/s/q>` | `n` (new remote) |
| `name>` | `r2` |
| `Storage>` | `s3` (Amazon S3 Compliant) |
| `provider>` | `Cloudflare` |
| `access_key_id>` | *(from Cloudflare R2 dashboard → Manage API Tokens → Create API Token → R2 Token)* |
| `secret_access_key>` | *(same page)* |
| `endpoint>` | `https://<account_id>.r2.cloudflarestorage.com` |

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
