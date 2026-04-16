import { extractYouTubeVideoId } from "./extract";
import type { EventFrontmatter } from "./types";

const SITE_URL = "https://cppserbia.org";

export function buildAnnouncementMetadata(frontmatter: EventFrontmatter, slug: string) {
  const eventDate =
    frontmatter.date instanceof Date
      ? frontmatter.date.toISOString().slice(0, 19)
      : String(frontmatter.date);

  return {
    type: "announcement",
    event_title: frontmatter.title,
    event_slug: slug,
    event_url: `${SITE_URL}/events/${slug}`,
    event_date: eventDate,
    event_type: frontmatter.event_type || "",
    venue: frontmatter.venues?.[0] || "",
    registration_url: frontmatter.event_url || "",
    image_url: frontmatter.imageUrl || "",
  };
}

export function buildAnnouncementPayload(
  frontmatter: EventFrontmatter,
  slug: string,
  en: string,
  sr: string
) {
  return {
    social_text_en: en,
    social_text_sr: sr,
    ...buildAnnouncementMetadata(frontmatter, slug),
  };
}

export function buildRecordingMetadata(frontmatter: EventFrontmatter, slug: string) {
  const youtubeUrl = frontmatter.youtube || "";
  const videoId = extractYouTubeVideoId(youtubeUrl);

  return {
    youtube_url: youtubeUrl,
    youtube_thumbnail_url: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
    image_url: frontmatter.imageUrl || "",
    event_title: frontmatter.title,
    event_slug: slug,
  };
}

export function buildRecordingPayload(
  frontmatter: EventFrontmatter,
  slug: string,
  en: string,
  sr: string
) {
  return {
    social_text_en: en,
    social_text_sr: sr,
    ...buildRecordingMetadata(frontmatter, slug),
  };
}
