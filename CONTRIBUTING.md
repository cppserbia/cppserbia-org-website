# Contributing to C++ Serbia Website

Thanks for your interest in contributing! This guide covers the most common tasks: adding events, posting recordings, and understanding the social media automation.

## Quick Start

### Prerequisites

- **Node.js 24** (pinned in `.nvmrc` and `package.json` `engines`). We recommend [`fnm`](https://github.com/Schniz/fnm) for version management — it's cross-platform and picks up `.nvmrc` automatically:

  ```bash
  # Install fnm
  brew install fnm              # macOS
  winget install Schniz.fnm     # Windows
  # Linux: curl -fsSL https://fnm.vercel.app/install | bash

  # One-time shell setup (adapt for your shell)
  echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc
  source ~/.zshrc

  # Install Node 24 (one-time, per machine)
  fnm install 24
  ```

  After this, `cd`-ing into the repo auto-switches to Node 24.

- **pnpm** — install via `npm i -g pnpm` or `corepack enable`.

### Clone and run

```bash
git clone https://github.com/cppserbia/cppserbia-org-website
cd cppserbia-org-website
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site. See the [README](README.md) for the full list of available scripts.

## Adding a New Event

### 1. Create the event on Meetup.com first

You'll need the Meetup event URL and event ID for the frontmatter.

> **Tip:** you can skip this step and let the automation do it — see [Creating the Meetup.com draft automatically](#creating-the-meetupcom-draft-automatically) below. Leave `event_url` / `event_id` as the template placeholders and label the PR `meetup-event`.

### 2. Create the event file

Copy the template and rename it:

```bash
cp events/_template-event.md events/YYYY-MM-DD-Event-Title.md
```

Use the actual event date and a URL-friendly title (e.g., `2025-09-18-Modern-CMake-Best-Practices.md`).

### 3. Fill in the frontmatter

All required fields:

| Field        | Description                       | Example                                               |
| ------------ | --------------------------------- | ----------------------------------------------------- |
| `title`      | Event title                       | `"Modern CMake Best Practices"`                       |
| `date`       | Start date/time (local)           | `2025-09-18T18:00:00`                                 |
| `created`    | When you created this file        | `2025-09-01T10:00:00`                                 |
| `event_type` | `PHYSICAL`, `ONLINE`, or `HYBRID` | `PHYSICAL`                                            |
| `status`     | `ACTIVE`, `PAST`, or `DRAFT`      | `ACTIVE`                                              |
| `duration`   | ISO 8601 duration                 | `PT2H`                                                |
| `end_time`   | End date/time (local)             | `2025-09-18T20:00:00`                                 |
| `event_url`  | Meetup.com event link             | `https://www.meetup.com/cpp-serbia/events/123456789/` |
| `event_id`   | Meetup.com event ID               | `123456789`                                           |
| `venues`     | Venue list                        | `['Palata "Beograd" ("Beograđanka"), Beograd, rs']`   |

Optional fields:

| Field      | Description                                                               |
| ---------- | ------------------------------------------------------------------------- |
| `imageUrl` | Banner image URL (e.g., `https://images.cppserbia.org/events/{slug}.jpg`) |
| `youtube`  | YouTube recording link (add after the event)                              |

**Status values:**

- **`ACTIVE`** — Visible on the site. Use for upcoming events.
- **`PAST`** — Visible on the site. Use after the event has happened.
- **`DRAFT`** — Only visible locally when running `pnpm dev`. Use while preparing the event page.

> Note: The code treats anything that isn't `DRAFT` as visible, so both `ACTIVE` and `PAST` events appear on the production site.

Example frontmatter for a new event:

```yaml
---
title: "Modern CMake Best Practices"
date: 2025-09-18T18:00:00
created: 2025-09-01T10:00:00
event_type: PHYSICAL
status: ACTIVE
duration: PT2H
end_time: 2025-09-18T20:00:00
event_url: https://www.meetup.com/cpp-serbia/events/123456789/
event_id: 123456789
venues: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
---
```

### 4. Write the body

Follow this structure:

1. `# Event Title` — heading matching the frontmatter title
2. Description of the talk and speaker
3. (Optional) Code snippets relevant to the topic
4. `## Event Details` — table with speaker, date, location, and online link

See [`events/_template-event.md`](events/_template-event.md) for a complete example.

### 5. Open a pull request

Push your branch and open a PR targeting `main`. CI runs lint, formatting, type check, spell check, and tests automatically.

### 6. (Optional) Generate social media announcement

Once your PR is open, a team member can comment `/social:announcement` on the PR. This triggers AI-generated social media posts that appear in the PR description for review. See [How Social Media Automation Works](#how-social-media-automation-works) below.

## Creating the Meetup.com Draft Automatically

If you don't want to create the Meetup event by hand, open the PR with `event_url` and `event_id` left as the template placeholders (`<Meetup.com Event URL>` / `<Meetup.com Event ID>`), then apply the `meetup-event` label to the PR. A workflow will:

1. Read the event markdown,
2. Call the Meetup GraphQL API to create a **Draft** event (visible only to organizers),
3. If `imageUrl` is already in frontmatter, upload the banner as the Meetup featured photo,
4. Commit `event_url` and `event_id` back to the PR branch,
5. Post a comment with the Meetup draft link.

The draft is not published — an organizer still has to review and publish it from the Meetup dashboard. Re-applying the label on a PR that already has `event_id` is a no-op (idempotent).

Prerequisites (one-time, admin-only): the Meetup OAuth client must have the `event_management` scope, and new venues must be mapped in `scripts/meetup/venues.ts`. Full setup and troubleshooting: [`scripts/meetup/README.md`](scripts/meetup/README.md).

## Event Checklist

A compact walkthrough of the sections above. Skim, then jump back up for detail where needed.

**Before the PR**

- [ ] Branch off `main`: `git checkout -b event/<slug>`
- [ ] Copy the template: `cp events/_template-event.md events/YYYY-MM-DD-<Slug>.md`
- [ ] Fill in frontmatter. Use `status: DRAFT` while authoring.
- [ ] Confirm the venue string in `venues:` matches an entry in [`scripts/meetup/venues.ts`](scripts/meetup/venues.ts). If it doesn't, add it — see [`scripts/meetup/README.md`](scripts/meetup/README.md#finding-a-venue-id).
- [ ] Leave `event_url` and `event_id` as the template placeholders (the Meetup automation fills them in). Leave `imageUrl` unset (the banner automation fills it in).
- [ ] (Social events without a single speaker) optionally add `banner_author:` to frontmatter — appears as the top line on the generated banner. Example: `banner_author: "@ Docker Brewery"`.
- [ ] Write the body — see [Writing the description](#writing-the-description) below.
- [ ] `pnpm dev` → open `/events/<slug>` locally and verify the page renders.

**In the PR**

- [ ] Push the branch and open a PR targeting `main`.
- [ ] CI passes (`lint`, `format:check`, `typecheck`, `spell`, `test`).
- [ ] Banner workflow auto-runs → bot generates 3 banners, uploads to R2, commits `imageUrl` back. Preview links land in a PR comment; eyeball the horizontal one.
- [ ] Apply the `meetup-event` label → bot creates the Meetup draft (with the just-uploaded banner attached as featured photo) and commits `event_url` + `event_id` back to your branch.
- [ ] Open the Meetup draft link from the bot comment and spot-check title, date, venue, description.
- [ ] (Optional) Comment `/social:announcement` → AI draft lands in the PR description for review.
- [ ] Flip `status: DRAFT` → `status: ACTIVE` in the event file (this is what makes it visible on the production site).

**Merge & go live**

- [ ] Merge the PR — Vercel deploys the site automatically.
- [ ] Publish the Meetup draft from the Meetup organizer dashboard.
- [ ] If `/social:announcement` ran, the merge also triggers the social media webhook.

**After the event**

- [ ] Add `youtube:` to the event's frontmatter, flip `status` to `PAST`.
- [ ] Open a PR → comment `/social:new-yt` → merge when the recording post looks good.

## Writing the description

Before typing, classify the event. Each type has a different content shape.

```
What kind of event is it?
│
├─ Talk (one speaker, presenting material)              → Talk template
├─ Panel / code review (multiple voices, interactive)    → Panel template
├─ Workshop / hackathon (attendees build something)      → Workshop template
└─ Social (beer, picnic, celebration — no agenda)        → Social template
```

Then decide the delivery mode (`event_type` in frontmatter):

```
Where does it happen?
│
├─ In-person only                          → PHYSICAL: Location + Address rows
├─ Remote only (stream / call)              → ONLINE: Platform link, no Address
└─ Both                                    → HYBRID: Location + Address + Online
```

### Talk template

- **Hook paragraph** — what problem or idea will the talk explore? One or two sentences that make a scroller stop.
- **About the speaker** — bold name, link to LinkedIn / GitHub / personal site, one sentence on their background.
- **What you'll learn** — 2–3 short paragraphs on the content: the angle the speaker takes, what's new or non-obvious, who it's for (beginner / intermediate / advanced).
- **Optional code snippet** — a small excerpt that showcases the topic. The `_template-event.md` includes an example.
- **Event Details table** — Speaker, Date & Time, Location, Address, Online (if HYBRID).

### Panel template

- **The question** — what are the panelists there to answer? Frame it as a question the audience brings.
- **Panelists** — a brief line per panelist (name, role, why they're on this panel).
- **Anchor topics** — 3–5 bullets of what will come up.
- **Event Details table** — replace the Speaker row with a Panelists row; keep everything else.

### Workshop template

- **Outcome** — what will attendees walk away with? ("By the end you'll have built X", "You'll understand Y", …)
- **Prerequisites** — concrete list: laptop, compiler version, a repo to clone, prior knowledge.
- **Agenda** — rough time blocks.
- **Event Details table** — add a Bring row above Location.

### Social template

- **Occasion / vibe** — why are we meeting? (Founding celebration, end-of-year, Beer Wednesday.)
- **What to expect** — no talks, casual hangout, food / drink situation.
- **Logistics** (if useful) — transport, parking, RSVP hint so headcount stocks are sensible.
- **Event Details table** — skip the Speaker and Online rows; keep Date, Location, Address.

### Rules of thumb (any type)

- Keep paragraphs short — 3–4 lines each. Meetup descriptions render in a narrow column.
- Serbian, English, or a mix are all fine. Match the audience: beginner-friendly events tend Serbian, advanced/guest-speaker events tend English. Look at recent events in `events/` for tone.
- Close with a warm sign-off (`See you there!`, `Vidimo se u <venue>!`, `🍻`, …).
- **Don't duplicate frontmatter inside the body.** Meetup shows title / date / venue separately from the description — if you repeat them as a table, it's just clutter in the Meetup UI. The website uses the table, so keep it — just know it's site-only polish, not description content.
- Reference example bodies in `events/` by type: talk → `2024-09-18-World-of-Bitcoin-open-sourced-Cpp-project.md`, panel → `2025-01-29-Cpp-Serbia-does-code-review.md`, social → `2024-08-30-Cpp-Serbia-Picnic.md` or `2023-06-07-Cpp-Serbia-Beer-Wednesday.md`.

## After the Event: Adding the YouTube Recording

1. Edit the event's `.md` file and add the `youtube:` frontmatter field:

   ```yaml
   youtube: https://www.youtube.com/watch?v=VIDEO_ID
   ```

2. Update `status` to `PAST` if it isn't already.

3. Open a PR targeting `main`.

4. A team member comments `/social:new-yt` on the PR. This triggers AI-generated "recording is now available" social media posts.

5. The AI draft appears in the PR description between special markers. Edit it as needed, then merge to publish.

## How Social Media Automation Works

The repo has automated bilingual (English + Serbian) social media post generation powered by two parallel flows:

**Announcement flow** (upcoming events):

1. A PR adds a new event file
2. Team member comments `/social:announcement` on the PR
3. Gemini AI generates bilingual social media posts
4. The draft appears in the PR description for human review and editing
5. Merging the PR triggers a webhook to Make.com, which distributes to LinkedIn, Facebook, Telegram, Discord, and Instagram

**Recording flow** (past event recordings):

1. A PR adds a `youtube:` field to an event file
2. Team member comments `/social:new-yt` on the PR
3. Same flow: AI draft in PR description, human edits, merge publishes

Both flows use the same underlying script (`scripts/generate-social-draft.ts`) with different `--type` flags. The AI generates posts in both English and Serbian, and a human always reviews and edits the draft before it goes live.

For Make.com scenario setup and webhook configuration (admin only), see [`scripts/SOCIAL_MEDIA_MAKE_SETUP.md`](scripts/SOCIAL_MEDIA_MAKE_SETUP.md).

## Event Image Banners

Event banner images are hosted on Cloudflare R2 at `images.cppserbia.org`. For most contributors, just set the `imageUrl` field in frontmatter if you have a banner image URL.

The full image pipeline (downloading from Meetup, syncing to R2) is documented in [`scripts/README.md`](scripts/README.md).

## Development

### Quality gates

Five checks run in CI on every PR to `main`. Run them locally with:

| Command             | What it does                                                         |
| ------------------- | -------------------------------------------------------------------- |
| `pnpm lint`         | ESLint (+ unused-imports + import sorting). `pnpm lint:fix` to fix.  |
| `pnpm format:check` | Prettier check. `pnpm format` to write.                              |
| `pnpm typecheck`    | `tsc --noEmit`. Build has `ignoreBuildErrors`, so CI is the TS gate. |
| `pnpm spell`        | cspell across source + docs. See [Spell checking](#spell-checking).  |
| `pnpm test`         | Vitest. Tests are colocated with route handlers.                     |

A **husky pre-commit hook** runs `lint-staged` (Prettier + `eslint --fix` on staged files), installed automatically by `pnpm install`.

Run a single test file:

```bash
pnpm exec vitest run app/feed.ics/route.test.ts
```

### Spell checking

`cspell.json` is the single source of truth — **do not** add inline `// cspell:ignore` comments. If `pnpm spell` flags a legitimate word:

- **Project/tech terms** (library names, acronyms) → add to `.cspell/project-terms.txt`
- **Serbian words** (proper nouns, common words) → add to `.cspell/serbian-terms.txt`
- **Real typo** → fix it in the source

Serbian content is already handled by config: `events/*.md` and a few Serbian-heavy test/prompt files are in `ignorePaths`; Cyrillic and Latin-with-diacritics (`čćžšđ`) tokens are stripped by regex. Diacritic-less Serbian in bilingual files is the only thing that ends up in the dictionary.

### Deploy

Vercel auto-deploys from `main`. There is no manual deploy step. The build has `ignoreBuildErrors`/`ignoreDuringBuilds` on, so a single minor issue won't block a deploy — but CI will block the merge.
