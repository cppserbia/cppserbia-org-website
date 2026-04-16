# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev           # Start dev server (http://localhost:3000)
pnpm build         # Production build
pnpm start         # Start production server
pnpm lint          # ESLint (next/core-web-vitals + next/typescript + import sort + unused-imports)
pnpm lint:fix      # ESLint with --fix
pnpm format        # Prettier --write across the repo
pnpm format:check  # Prettier --check (used in CI)
pnpm typecheck     # tsc --noEmit (used in CI; build still has ignoreBuildErrors)
pnpm test          # Run tests once (vitest --run)
pnpm test:watch    # Run tests in watch mode
```

A husky pre-commit hook runs `lint-staged` (prettier + `eslint --fix` on staged files). It's installed automatically by `pnpm install` via the `prepare` script.

## Architecture

Next.js 15 App Router site for the C++ Serbia community. All content is Markdown files on disk — no database or CMS.

### Data flow

Event `.md` files in `/events/` → parsed by `lib/events-server.ts` (gray-matter + Temporal API) → consumed by React Server Components and route handlers.

### Key directories

- **`/events/`** — Markdown event files (`YYYY-MM-DD-Event-Title.md`). `_template-event.md` is the authoring guide.
- **`/app/`** — Next.js App Router pages, layouts, and route handlers.
- **`/components/`** — React components. `/components/ui/` is shadcn/ui primitives. `/components/seo/` has JSON-LD structured data (`OrganizationSeo`, `EventSeo`, `EventsListSeo`).
- **`/lib/`** — Server utilities (`events-server.ts`), client-safe types (`events.ts`), date helpers (`temporal.ts`), SEO utils. `utils.ts` exports `cn()` (clsx + tailwind-merge) used by all components.

### Server/client split

- `lib/events-server.ts` — Server-only. Uses `fs` to read event files. Exports `getAllEventsServer()`, `getEventsByDate()`, `getEventBySlug()`, `getFeaturedEvents()`.
- `lib/events.ts` — Client-safe `Event` interface (dates as strings, not Temporal objects).
- Components are Server Components by default. Client components are marked with `"use client"` (navbar, social-links, feed buttons, code-block, theme-provider).

### Date/time handling

All date logic uses `@js-temporal/polyfill` via `lib/temporal.ts`. Default timezone is `Europe/Belgrade`. The `dateToZonedDateTime()` helper works around gray-matter interpreting frontmatter dates as UTC.

### Route handlers

| Route                                | Format      | Purpose                                      |
| ------------------------------------ | ----------- | -------------------------------------------- |
| `/events/feed.xml`                   | RSS 2.0 XML | Events RSS feed (20 most recent, 24h cache)  |
| `/feed.ics`                          | iCal        | Full calendar feed (1h cache)                |
| `/events/[slug]/calendar.ics`        | iCal        | Single event download (1h cache)             |
| `/feed.xml`                          | RSS 2.0 XML | Full events feed (all items, `feed` library) |
| `/sitemap.ts`                        | XML         | Dynamic sitemap with all event slugs         |
| `/robots.ts`                         | Text        | robots.txt generation                        |
| `/events/[slug]/opengraph-image.tsx` | PNG         | Dynamic OG image per event                   |

### Styling

Tailwind CSS v3 + shadcn/ui design tokens. Custom utility classes defined in `app/globals.css` (`gradient-brand-*`, `prose-custom`, layout helpers). Fonts: Rubik (body), JetBrains Mono (code).

### Gotchas

- `next.config.mjs` sets `ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — **`pnpm build` will succeed even with TS or lint errors**. Always run `pnpm lint` separately.
- Two RSS feeds exist: `/events/feed.xml` (hand-rolled XML, 20 items, 24h CDN cache) and `/feed.xml` (`feed` library, all items). Only the former is advertised in `<head>`.
- Event `status` field: code only checks `!== 'DRAFT'`. Any non-DRAFT value (ACTIVE, PAST, etc.) makes the event visible.
- `getFeaturedEvents()` returns the N most recent events, not events with `featured: true`.

## Adding Events

1. Create `/events/YYYY-MM-DD-Event-Title.md` (copy `_template-event.md`)
2. Required frontmatter: `title`, `date`, `event_type` (PHYSICAL/ONLINE/HYBRID), `status` (ACTIVE/PAST/DRAFT), `end_time`, `venues`
3. Events with `status: DRAFT` are only visible in dev (`pnpm dev`)
4. Body convention: `# Title`, description, `# About Speaker`, `## Event Details` table
5. After the event: add `youtube:` frontmatter field for the recording link

## Testing

Tests are colocated with route handlers (e.g., `app/feed.ics/route.test.ts`). They use Vitest + @testing-library/react with jsdom environment. Run a single test file:

```bash
pnpm exec vitest run app/feed.ics/route.test.ts
```

## Deployment

Hosted on Vercel (auto-deploys from `main`). CI via GitHub Actions (`.github/workflows/ci.yml`): runs `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, and `pnpm test` on pushes/PRs to `main`. CI does **not** run `pnpm build` — Vercel does that, and `next.config.mjs` keeps `ignoreBuildErrors`/`ignoreDuringBuilds` so deploys aren't blocked on minor issues. CI is the gate.

## Scripts & Infrastructure

### Image pipeline (`/scripts/`)

Event banner images are hosted on Cloudflare R2 at `images.cppserbia.org`. Run scripts with `npx tsx scripts/<name>.ts`:

1. `download-meetup-images.ts` — Downloads banners from Meetup GraphQL API
2. `update-event-images.ts` — Adds `imageUrl` frontmatter to event `.md` files
3. `sync-images.sh` — Uploads local images to R2 via `rclone`

Requires `.env` with Meetup OAuth credentials + `meetup-private-key.pem`. See `scripts/README.md` for setup. These env vars are **not** needed for `pnpm dev` or `pnpm build`.

### Social media pipeline

Automated bilingual (English + Serbian) social media post generation. Two caller workflows (`social-media-draft.yml` and `publish-social.yml`) each contain two jobs and delegate to two reusable workflows (`_generate-social-draft.yml` and `_publish-social.yml`). Both flows share the same script (`scripts/generate-social-draft.ts`) with a required `--type` flag. See `CONTRIBUTING.md` for the human-facing workflow.

**Recording flow** (announces YouTube recordings of past events):
PR adds `youtube:` field → team comments `/social:new-yt` → AI generates draft in PR description → human edits → merge triggers POST to Make.com.

- `.github/workflows/social-media-draft.yml` (`new-yt` job) — `issue_comment` trigger on `/social:new-yt`. Calls `_generate-social-draft.yml`. Updates PR description between `<!-- SOCIAL_MEDIA_START -->` / `<!-- SOCIAL_MEDIA_END -->` markers.
- `.github/workflows/publish-social.yml` (`new-yt` job) — `pull_request` closed+merged trigger. Calls `_publish-social.yml`. POSTs recording payload to `MAKE_NEW_YT_WEBHOOK_URL`.

**Announcement flow** (announces upcoming events):
PR adds new event file → team comments `/social:announcement` → AI generates invitation draft → human edits → merge triggers POST to Make.com.

- `.github/workflows/social-media-draft.yml` (`announcement` job) — `issue_comment` trigger on `/social:announcement`. Calls `_generate-social-draft.yml`. Detects **newly added** (not modified) event files. Updates PR description between `<!-- EVENT_ANNOUNCEMENT_START -->` / `<!-- EVENT_ANNOUNCEMENT_END -->` markers.
- `.github/workflows/publish-social.yml` (`announcement` job) — `pull_request` closed+merged trigger. Calls `_publish-social.yml`. POSTs announcement payload (with `type`, `event_date`, `venue`, `registration_url`) to `MAKE_ANNOUNCEMENT_WEBHOOK_URL`.

**Reusable workflows:**

- `_generate-social-draft.yml` — Accepts only `type_flag` (`"recording"` or `"announcement"`). Derives marker names, section titles, and find logic internally from the type. Single script invocation outputs full payload JSON. PR description shows the payload in a fenced code block for human editing.
- `_publish-social.yml` — Accepts `type` (`"recording"` or `"announcement"`), `pr_number`, and `dry_run`. Extracts payload JSON from PR body between markers, feeds it to `publish-payload.ts` which POSTs to Make.com.

**Shared script:** `scripts/generate-social-draft.ts`

- `--type recording`: requires `youtube:` frontmatter, generates "recording is up" posts
- `--type announcement`: requires non-DRAFT status, generates "come join us" posts
- Output is a JSON payload with social text (`social_text_en`, `social_text_sr`) and event metadata
- Run: `npx tsx scripts/generate-social-draft.ts --type announcement events/<file>.md`

**Publish script:** `scripts/social/publish-payload.ts`

- Reads payload JSON from a file argument or stdin, POSTs to Make.com
- Strips markdown code fences if present (from PR body extraction)
- Env vars: `MAKE_WEBHOOK_URL`, `MAKE_API_KEY` (required unless `DRY_RUN=true`)
- Run: `npx tsx scripts/social/publish-payload.ts payload.json`

**Required secrets:** `GEMINI_API_KEY` (Google AI Studio), `MAKE_NEW_YT_WEBHOOK_URL` (recording webhook), `MAKE_ANNOUNCEMENT_WEBHOOK_URL` (announcement webhook), `MAKE_API_KEY` (Make.com API key). See `scripts/SOCIAL_MEDIA_MAKE_SETUP.md` for Make.com scenario setup.

### Infrastructure (`/infra/`)

Terraform config for Cloudflare R2 bucket + custom domain. See `scripts/README.md` for full setup.
