# Meetup.com Integration

Everything that talks to the Meetup.com GraphQL API lives in or consumes this directory.

## What's here

| File             | Purpose                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `client.ts`      | Shared JWT-Bearer OAuth + GraphQL client (`createMeetupClient()`) used by all three scripts |
| `venues.ts`      | Maps event frontmatter `venues:` strings to numeric Meetup venue IDs                        |
| `list-venues.ts` | Helper that dumps the group's venues as a ready-to-paste `VENUE_IDS` record                 |

Consumers in the parent `scripts/` directory:

- [`../download-meetup-images.ts`](../download-meetup-images.ts) — read-only; downloads banner images for the R2 image pipeline
- [`../create-meetup-event.ts`](../create-meetup-event.ts) — creates **Draft** Meetup events from event markdown and writes `event_url` + `event_id` back

CI workflow: [`../../.github/workflows/meetup-event-draft.yml`](../../.github/workflows/meetup-event-draft.yml) runs `create-meetup-event.ts` when a PR is labeled `meetup-event`.

---

## One-time OAuth setup

### 1. Create a Meetup OAuth app

1. Go to [Meetup OAuth App Creation](https://www.meetup.com/api/oauth/create/).
2. Fill in the app details (name; redirect URI — any valid URL works for the JWT Bearer flow).
3. **Grant the `event_management` scope.** Read-only scripts work without it, but `create-meetup-event.ts` needs it to call `createEvent`. Without this scope, that mutation 403s.
4. Note the **Consumer Key** → `MEETUP_CLIENT_KEY`.

### 2. Generate an RSA signing key

In the OAuth app settings:

1. Open the **JWT Signing Keys** section.
2. Click **Generate Key**. Meetup creates an RSA key pair.
3. Download the **private key** PEM file and save it (e.g. `meetup-private-key.pem`). It is gitignored (`*.pem`).
4. Copy the **Key ID** → `MEETUP_SIGNING_KEY_ID`.

### 3. Find your Meetup member ID

Visible in your Meetup profile URL or via the API. → `MEETUP_MEMBER_ID`. The account must be an organizer of the target group, or `createEvent` will be denied even with the right scope.

---

## Environment variables

Add these to `.env` (gitignored) in the repo root:

```bash
MEETUP_CLIENT_KEY=your-consumer-key
MEETUP_MEMBER_ID=your-member-id
MEETUP_SIGNING_KEY_ID=your-key-id
MEETUP_PRIVATE_KEY_PATH=./meetup-private-key.pem
MEETUP_GROUP_URLNAME=cpp-serbia
```

| Variable                  | Used by                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `MEETUP_CLIENT_KEY`       | `client.ts` (all scripts)                                                    |
| `MEETUP_MEMBER_ID`        | `client.ts` (all scripts)                                                    |
| `MEETUP_SIGNING_KEY_ID`   | `client.ts` (all scripts)                                                    |
| `MEETUP_PRIVATE_KEY_PATH` | `client.ts` (all scripts)                                                    |
| `MEETUP_GROUP_URLNAME`    | `create-meetup-event.ts`, `list-venues.ts` (not needed for image downloader) |

In CI (`.github/workflows/meetup-event-draft.yml`) these come from repo **secrets** — except `MEETUP_GROUP_URLNAME`, which is a repo **variable** since it isn't sensitive. `MEETUP_PRIVATE_KEY` is the PEM contents; the workflow writes it to a tmpfile and points `MEETUP_PRIVATE_KEY_PATH` at it.

---

## Scripts

### `list-venues.ts` — refresh `venues.ts`

```bash
npx tsx scripts/meetup/list-venues.ts
# or override the group slug:
npx tsx scripts/meetup/list-venues.ts --group cpp-serbia
```

Prints raw venue details to stderr and a ready-to-paste `VENUE_IDS` record to stdout. Re-run whenever a new venue shows up on Meetup, then copy the new line into `venues.ts`.

### `create-meetup-event.ts` — create a Draft event

```bash
# Dry-run: print the CreateEventInput payload, no API call
npx tsx scripts/create-meetup-event.ts --dry-run events/<file>.md

# Real run: create the draft and rewrite frontmatter
npx tsx scripts/create-meetup-event.ts events/<file>.md
```

Behavior:

- **Idempotent.** Skips if `event_id` is already a real numeric ID (not the `<Meetup.com Event ID>` placeholder).
- **Writes back** `event_url` + `event_id` into the file's frontmatter on success (via `matter.stringify`).
- **Uploads the banner** if `imageUrl:` is present in frontmatter — calls `createGroupEventPhoto` with `setAsMain: true` so Meetup auto-attaches the photo as featured. Photo upload failures are non-fatal: the draft is still created and the frontmatter is still written.
- **Fails loud** if a venue string in the event is not in `venues.ts`.

The CI workflow runs the same script on `pull_request: labeled` when the label is `meetup-event` and the PR author is OWNER / MEMBER / COLLABORATOR. On success it commits the frontmatter change back to the PR branch and posts a comment with the Meetup draft URL.

### `download-meetup-images.ts` — fetch banner images (read-only)

Part of the R2 image pipeline. See [`../README.md`](../README.md) for the full R2 / rclone / Terraform context.

---

## Finding a venue ID

There are two paths depending on whether Meetup already knows the venue.

### Path A — venue has been used on this group before

If the venue appears in any past event on the group's Meetup page, `list-venues.ts` can grab its ID directly:

```bash
npx tsx scripts/meetup/list-venues.ts
```

Copy the relevant entry from stdout into `scripts/meetup/venues.ts`. Done.

### Path B — brand-new venue, never attached to this group

The Meetup API only exposes venues that are already linked to your group, and `createEvent` rejects venue IDs Meetup doesn't recognise. So you need to get Meetup to register the venue against your group first. The reliable way:

1. Sign in to Meetup as a **group organizer**.
2. Start creating a new event via the Meetup UI (e.g. _Your Groups → Schedule → New event_).
3. In the venue section, search for the venue by name or address. If no match exists, fill in the address fields — Meetup creates a new venue record and attaches it to your group.
4. **Save as draft** (no need to publish). The new venue is now registered.
5. Back in the repo, run:

   ```bash
   npx tsx scripts/meetup/list-venues.ts
   ```

   The new venue appears in the output with its numeric ID.

6. Copy the new line into `scripts/meetup/venues.ts` and commit.
7. Delete the throwaway Meetup draft (_Your Groups → Drafts → … → Delete_) — the venue stays registered even after the draft is gone.

From then on, any event whose `venues:` frontmatter uses the exact string the helper printed will resolve automatically when the `meetup-event` label fires.

### Quirks to know

- Keys in `venues.ts` must match the **exact** string in event frontmatter `venues:` arrays — including quotes, diacritics, and the `", City, cc"` suffix. `list-venues.ts` formats keys as `"{name}, {city}, {country}"`, which matches what past events reference.
- Older venues can have legacy fields: country `yu` (Yugoslavia) or English/uppercase city names (`Belgrade, RS` vs `Beograd, rs`). Whatever Meetup returns is what events must reference.
- If you rename a venue on Meetup, its numeric ID stays stable but its key in `venues.ts` must be updated to the new string.

---

## Troubleshooting

| Symptom                                                | Likely cause                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `createEvent` returns 403 or `insufficient_scope`      | OAuth client is missing the `event_management` scope — re-grant it in the Meetup OAuth dashboard. |
| `Unknown venue "…"`                                    | Add the venue to `venues.ts`. Run `list-venues.ts` to find its numeric ID.                        |
| `Meetup group not found for urlname "…"`               | `MEETUP_GROUP_URLNAME` is wrong or the member isn't an organizer of that group.                   |
| `OAuth2 token exchange failed: 401`                    | Private key / signing key ID / client key mismatch. Re-check `.env` values.                       |
| `createGroupEventPhoto returned no photo or uploadUrl` | Image fetch succeeded but Meetup rejected the upload. Check image is reachable and < ~10 MB.      |
