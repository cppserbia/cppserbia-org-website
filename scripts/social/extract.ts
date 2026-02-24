const MIN_DESCRIPTION_LENGTH = 50;

export function extractSpeakerName(content: string): string | null {
  // Look for speaker name in the Event Details table: | Speaker | **[Name](url)** |
  const speakerLinkMatch = content.match(/👤\s*\*\*Speaker\*\*\s*\|\s*\*?\*?\[([^\]]+)\]/);
  if (speakerLinkMatch) return speakerLinkMatch[1];

  // Fallback: | Speaker | **Name** |
  const speakerBoldMatch = content.match(/👤\s*\*\*Speaker\*\*\s*\|\s*\*\*([^*]+)\*\*/);
  if (speakerBoldMatch) return speakerBoldMatch[1];

  // Fallback without emoji (in case template changes)
  const speakerNoEmojiLink = content.match(/\*\*Speaker\*\*\s*\|\s*\*?\*?\[([^\]]+)\]/);
  if (speakerNoEmojiLink) return speakerNoEmojiLink[1];

  const speakerNoEmojiBold = content.match(/\*\*Speaker\*\*\s*\|\s*\*\*([^*]+)\*\*/);
  if (speakerNoEmojiBold) return speakerNoEmojiBold[1];

  return null;
}

export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] || null;
}

export function extractDescription(content: string, frontmatterDescription?: string): string {
  if (frontmatterDescription) return frontmatterDescription;

  // Extract first meaningful paragraph from markdown body (same logic as events-server.ts)
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("*") &&
      !trimmed.startsWith("-") &&
      trimmed.length > MIN_DESCRIPTION_LENGTH
    ) {
      return trimmed;
    }
  }

  return "";
}

export function extractFullDescription(content: string, frontmatterDescription?: string): string {
  if (frontmatterDescription) return frontmatterDescription;

  // Return everything before the Event Details table (logistics section)
  const detailsPattern = /^##\s*📅\s*Event Details/m;
  const match = content.search(detailsPattern);
  const body = match !== -1 ? content.slice(0, match) : content;

  return body.trim();
}

export function parseSocialText(text: string): { en: string; sr: string } {
  const enMatch = text.match(/🇬🇧\s*\*{0,2}English:?\*{0,2}\s*([\s\S]*?)(?=🇷🇸|$)/);
  const srMatch = text.match(/🇷🇸\s*\*{0,2}Srpski:?\*{0,2}\s*([\s\S]*?)$/);
  return {
    en: enMatch?.[1]?.trim() || "",
    sr: srMatch?.[1]?.trim() || "",
  };
}
