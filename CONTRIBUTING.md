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
