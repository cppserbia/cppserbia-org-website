# Make.com Scenario Setup — Social Media Pipeline

Guide for building the Make.com scenario that receives the GitHub Actions webhook payload and distributes posts to all five platforms.

**No code changes required** — this is purely Make.com configuration.

## Incoming Webhook Payload

The `publish-social.yml` workflow POSTs this JSON when a PR with social media text is merged:

```json
{
  "social_text_en": "Missed our latest meetup? ...",
  "social_text_sr": "Propustili ste poslednji meetup? ...",
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "youtube_thumbnail_url": "https://img.youtube.com/vi/.../hqdefault.jpg",
  "image_url": "https://images.cppserbia.org/events/...",
  "event_title": "Writing another command line arguments parser",
  "event_slug": "2024-10-02-Writing-another-command-line-arguments-parser"
}
```

> `youtube_thumbnail_url` is derived automatically from `youtube_url`. Use it when you want the YouTube video thumbnail instead of the event banner (`image_url`).

Derived values built inside Make.com:

- **Event page URL**: `https://cppserbia.org/events/{event_slug}`
- **Combined post text** (for most platforms): `{social_text_en}\n\n---\n\n{social_text_sr}`

## Platform Distribution

| Platform  | Language          | Format                              |
|-----------|-------------------|-------------------------------------|
| LinkedIn  | EN + SR combined  | Text post with link                 |
| Facebook  | EN + SR combined  | Page post with link + image         |
| Telegram  | EN + SR combined  | Message with link preview           |
| Discord   | EN + SR combined  | Webhook embed with image + link     |
| Instagram | Separate EN + SR  | Two stories, each with banner image |

---

## Step 1 — Create Scenario & Webhook Trigger

1. Go to **Scenarios → Create a new scenario**
2. Click **+**, search **Webhooks**, select **Custom webhook**
3. Click **Add** to create a new webhook. Name it `cppserbia-social-publish`
4. Copy the webhook URL
5. Save the URL as a GitHub Actions secret:
   - Repo → Settings → Secrets and variables → Actions
   - Add secret `MAKE_NEW_YT_WEBHOOK_URL` with the copied URL
6. **Generate a Make.com API key** for webhook authentication:
   - In Make.com, go to your **Profile → API Access** (or Organization → API)
   - Create/copy your API key
   - Add it as a GitHub Actions secret: `MAKE_API_KEY`
   - The workflow sends this key via the `x-make-apikey` HTTP header on every webhook call

## Step 2 — Determine Data Structure

Tell Make.com what the payload looks like so it can map fields:

1. With the webhook module selected, click **Redetermine data structure**
2. Send a test payload:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-make-apikey: YOUR_API_KEY_HERE" \
  -d '{
    "social_text_en": "Test English post about C++ Serbia meetup recording ▶️\n\nhttps://youtube.com/watch?v=test",
    "social_text_sr": "Test srpski post o C++ Serbia meetup snimku ▶️\n\nhttps://youtube.com/watch?v=test",
    "youtube_url": "https://www.youtube.com/watch?v=test123",
    "image_url": "https://images.cppserbia.org/events/2025-01-29-Performance-is-a-Feature.jpg",
    "youtube_thumbnail_url": "https://img.youtube.com/vi/test123/hqdefault.jpg",
    "event_title": "Test Event Title",
    "event_slug": "2025-01-29-Test-Event-Title"
  }' \
  "YOUR_WEBHOOK_URL_HERE"
```

3. Make.com should confirm **Successfully determined** and show the 7 fields

## Step 3 — Set Multiple Variables (Derived Values)

1. After the webhook, click **+** → search **Tools** → **Set multiple variables**
2. Add these variables:

| Variable name      | Value                                                                                     |
|--------------------|-------------------------------------------------------------------------------------------|
| `event_url`        | `https://cppserbia.org/events/` + `{{1.event_slug}}`                                      |
| `combined_post`    | `{{1.social_text_en}}` + (newline newline `---` newline newline) + `{{1.social_text_sr}}` |
| `post_en_with_url` | `{{1.social_text_en}}` + (two newlines) + `▶️ ` + `{{1.youtube_url}}`                     |
| `post_sr_with_url` | `{{1.social_text_sr}}` + (two newlines) + `▶️ ` + `{{1.youtube_url}}`                     |

> **Tip:** In the Make.com text editor, press Shift+Enter for literal newlines inside a field.

## Step 4 — Add Router (Parallel Paths)

1. After the variables module, click **+** → search **Flow control** → **Router**
2. This creates 5 branches — one per platform

## Step 5 — Branch 1: LinkedIn

LinkedIn's thumbnail requires file data, not a URL. Add two modules on this branch:

1. **+** → search **HTTP** → **Get a file**
   - **URL**: Map to `{{1.youtube_thumbnail_url}}` (or `{{1.image_url}}` for the event banner)
   - This downloads the image and outputs it as binary data

2. **+** → search **LinkedIn** → **Create a Share (UGC Post)**
   - **Connection**: Your authorized LinkedIn connection
   - **Author**: Your organization page (C++ Serbia)
   - **Share commentary**: `{{2.combined_post}}`
   - **Share media category**: `ARTICLE`
   - **Article link**: `{{1.youtube_url}}`
   - **Article title**: `{{1.event_title}}`
   - **Article description**: `{{2.event_url}}`
   - **Thumbnail**:
     - **File name**: Map to the HTTP module's file name output (e.g., `{{3.fileName}}`) — or hardcode `thumbnail.jpg`
     - **Data**: Map to the HTTP module's data output (e.g., `{{3.data}}`)

## Step 6 — Branch 2: Facebook

1. **+** → search **Facebook Pages** → **Create a Post**
2. Configure:
   - **Connection**: Your authorized Facebook connection
   - **Page**: C++ Serbia page
   - **Message**: `{{2.combined_post}}`
   - **Link**: `{{1.youtube_url}}`

Facebook will auto-generate a link preview with the YouTube thumbnail.

## Step 7 — Branch 3: Telegram

1. **+** → search **Telegram Bot** → **Send a Message**
2. Configure:
   - **Connection**: Your bot connection
   - **Chat ID**: Your C++ Serbia channel ID (e.g., `@cppserbia` or numeric ID)
   - **Text**: `{{2.combined_post}}` + two newlines + `▶️ ` + `{{1.youtube_url}}`
   - **Parse mode**: `Markdown` (or `HTML`)
   - **Disable link preview**: `No` (so Telegram shows the YouTube embed)

## Step 8 — Branch 4: Discord

Using a Discord webhook (simpler than a bot):

1. **+** → **HTTP** → **Make a request**
2. Configure:
   - **URL**: Your Discord channel webhook URL
   - **Method**: `POST`
   - **Body type**: `Raw` / `JSON`
   - **Request content**:

```json
{
  "content": "{{2.combined_post}}",
  "embeds": [{
    "title": "{{1.event_title}}",
    "url": "{{1.youtube_url}}",
    "image": { "url": "{{1.image_url}}" },
    "color": 2271995
  }]
}
```

> `2271995` = `#22A8EB` (blue accent — change to your brand color)

**Alternative (Discord Bot module):**
- **Channel ID**: Your announcements channel ID
- **Message content**: `{{2.combined_post}}`
- Add an embed with the title, URL, and image fields as above

## Step 9 — Branch 5: Instagram (Two Stories)

Instagram Stories require images. Post **two stories** — one English, one Serbian — each with the event banner.

1. **+** → search **Instagram for Business** → **Create a Photo Story**
2. **Story 1 (English):**
   - **Connection**: Your authorized Instagram connection
   - **Image URL**: `{{1.image_url}}`
3. After Story 1, add another **Create a Photo Story** on the same branch
4. **Story 2 (Serbian):**
   - Same config (`{{1.image_url}}`)

> **Note:** Instagram Stories don't support text captions via API — the image IS the story. The event banner serves as the visual.

> **Alternative:** Replace stories with feed **Carousel Posts** — one slide English, one slide Serbian. Use **Create a Carousel Item Container** + **Create a Carousel Post** modules.

---

## Step 10 — Error Handling

1. Click the **wrench icon** on the scenario → **Error handling**
2. For each platform module, add an **Ignore** error handler (so one platform failure doesn't block the others)
3. Optionally add a final **Router** branch with a Slack/Email notification module that triggers on error

---

## Step 11 — Testing

### Option A: Run once with test data

1. Make sure the scenario is **OFF** (not scheduled)
2. Click **Run once** in the scenario editor
3. Send the test curl from Step 2
4. To avoid actual posting:
   - Right-click each platform module → **Disable module**
   - Enable only the webhook + variables modules
   - Run once → verify variables are composed correctly
   - Then enable one platform at a time, run once, verify, disable again

### Option B: Module-level testing

Each module has a **Run this module only** option (right-click). Feed it mock data to verify mapping without running the whole chain.

### Option C: End-to-end via GitHub Actions dry run

1. Push the branch with the `workflow_dispatch` trigger
2. Go to **Actions → Publish Social Media Posts → Run workflow**
3. Enter a PR number, leave **dry_run** checked
4. The workflow logs the payload but does NOT call Make.com
5. Copy the logged payload, use it in a curl to your Make.com webhook
6. Run with modules enabled/disabled as needed

---

## Step 12 — Go Live

1. Verify all 5 platform branches work individually
2. Full end-to-end: enable all modules, send test payload, confirm posts on all platforms
3. Delete the test posts from each platform
4. Turn the scenario **ON** (set scheduling to **Immediately** — triggers on every webhook call)
5. Set the `MAKE_NEW_YT_WEBHOOK_URL` GitHub secret if not already done
6. Merge a real PR with `youtube:` field and social media markers

---

## Scenario Layout

```
[Webhook: cppserbia-social-publish]
    │
    ▼
[Set Variables: event_url, combined_post, post_en_with_url, post_sr_with_url]
    │
    ▼
[Router]
    ├── LinkedIn: HTTP Get a file → Create Share (UGC Post)
    ├── Facebook: Create Page Post
    ├── Telegram: Send Message
    ├── Discord: HTTP POST to webhook (embed)
    └── Instagram: Create Photo Story (EN) → Create Photo Story (SR)
```

---

# Event Announcement Scenario

A separate Make.com scenario for announcing **upcoming events** (as opposed to recording announcements above).

## Announcement Webhook Payload

The `publish-social.yml` workflow (`announcement` job) POSTs this JSON when a PR with announcement text is merged:

```json
{
  "type": "announcement",
  "social_text_en": "Join us for a deep dive into codebase modernization! 🚀",
  "social_text_sr": "Pridružite nam se za duboko uranjanje u modernizaciju koda! 🚀",
  "event_title": "How to modernize your codebase?",
  "event_slug": "2026-02-25-How-to-modernize-your-codebase",
  "event_url": "https://cppserbia.org/events/2026-02-25-How-to-modernize-your-codebase",
  "event_date": "2026-02-25T18:00:00",
  "event_type": "PHYSICAL",
  "venue": "Palata \"Beograd\" (\"Beograđanka\"), Beograd, rs",
  "registration_url": "https://www.meetup.com/cpp-serbia/events/313413133/",
  "image_url": "https://images.cppserbia.org/events/2026-02-25-How-to-modernize-your-codebase.jpg"
}
```

Key differences from the recording payload:
- Has `"type": "announcement"` field
- No `youtube_url` or `youtube_thumbnail_url`
- Includes `event_date`, `event_type`, `venue`, and `registration_url`

## Announcement Scenario Setup

1. Create a **new** Make.com scenario (separate from the recording scenario)
2. Add a **Custom webhook** trigger. Name it `cppserbia-announcement-publish`
3. Save the webhook URL as GitHub secret: `MAKE_ANNOUNCEMENT_WEBHOOK_URL`
4. Reuse the existing `MAKE_API_KEY` secret for authentication

### Variable Composition

After the webhook module, add a **Set multiple variables** module:

| Variable name       | Value                                                                                       |
|---------------------|---------------------------------------------------------------------------------------------|
| `event_url`         | `https://cppserbia.org/events/` + `{{1.event_slug}}`                                        |
| `combined_teaser`   | `{{1.social_text_en}}` + (newline newline `---` newline newline) + `{{1.social_text_sr}}`   |
| `logistics_block`   | `📅 ` + formatted date from `{{1.event_date}}` + newline + `📍 ` + `{{1.venue}}` + newline + `🎟️ ` + `{{1.registration_url}}` |
| `full_post`         | `{{combined_teaser}}` + (two newlines) + `{{logistics_block}}`                              |

> **Note:** Make.com appends the logistics block (date, venue, RSVP link) after the AI-generated teaser text. The AI only writes the hook — logistics come from the structured payload.

### Platform Notes

The same 5-branch router pattern applies (LinkedIn, Facebook, Telegram, Discord, Instagram). Key differences:

- **Link**: Use `{{1.registration_url}}` (Meetup RSVP link) instead of a YouTube URL
- **Image**: Use `{{1.image_url}}` (event banner) — no YouTube thumbnail
- **Text**: Use `{{full_post}}` which includes the logistics block

## Verification Checklist (Announcement)

- [ ] Announcement webhook URL saved as `MAKE_ANNOUNCEMENT_WEBHOOK_URL` GitHub secret
- [ ] API key saved as `MAKE_API_KEY` GitHub secret (reused from recording scenario)
- [ ] Test curl with announcement payload receives a 200 response
- [ ] Variables module correctly composes `combined_teaser`, `logistics_block`, and `full_post`
- [ ] Posts include teaser text + logistics block (date, venue, RSVP link)
- [ ] Registration URL links to Meetup (not YouTube)
- [ ] Error handling is set to Ignore per module
- [ ] Scenario is set to run **Immediately**
- [ ] Full dry-run via GitHub Actions `workflow_dispatch` works end-to-end

---

## Verification Checklist (Recording)

- [ ] Webhook URL saved as `MAKE_NEW_YT_WEBHOOK_URL` GitHub secret
- [ ] API key saved as `MAKE_API_KEY` GitHub secret
- [ ] Test curl (with `x-make-apikey` header) receives a 200 response from Make.com
- [ ] Variables module correctly composes `event_url` and `combined_post`
- [ ] LinkedIn post shows combined EN+SR text with YouTube link preview
- [ ] Facebook post shows combined EN+SR text with YouTube link
- [ ] Telegram message shows combined text with link preview
- [ ] Discord message has embed with image, title, and YouTube link
- [ ] Instagram publishes two stories (one EN, one SR) with event banner
- [ ] Error handling is set to Ignore per module (failures are isolated)
- [ ] Scenario is set to run **Immediately** (not on a schedule)
- [ ] Full dry-run via GitHub Actions `workflow_dispatch` works end-to-end
