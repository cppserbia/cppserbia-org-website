export function buildRecordingPrompt(
  eventTitle: string,
  description: string,
  speakerName: string | null
): string {
  const speakerInfo = speakerName
    ? `- Speaker: ${speakerName}`
    : "- No named speaker (panel, workshop, or community event)";

  return `You are a social media manager for C++ Serbia, a C++ programming community in Belgrade, Serbia.

Write a short, punchy social media post announcing that the YouTube RECORDING of a past meetup talk is now available. This is NOT a live event invitation — the talk already happened, and the recording has just been published.

Event details:
- Event title: "${eventTitle}"
- Description: ${description}
${speakerInfo}

Requirements:
- Generate TWO versions: English first, then Serbian (Latin script)
- Each version must be 1-2 sentences and UNDER 200 characters (so it fits everywhere including Twitter with a URL)
- Use 1 relevant emoji per version
- Do NOT include any URLs (URLs will be added separately)
- Vary your phrasing every time — pick whichever hook style fits the talk best. Avoid repetitive openers across posts.
- The Serbian version should be a natural translation, not word-for-word
- Never use phrases like "Join us", "Don't miss", or anything that implies a future live event

Here are example posts to anchor the tone, length, and style. Pick whichever hook fits the talk, or invent a new one:

Example 1 — Curiosity gap (tease an insight):
🇬🇧 **English:**
Did you know <surprising fact about topic>? <speaker> digs into why at our latest meetup. 🎬
🇷🇸 **Srpski:**
Da li ste znali <surprising fact about topic>? <speaker> objašnjava zašto na našem poslednjem meetup-u. 🎬

Example 2 — Missed-it / catch-up (direct, FOMO):
🇬🇧 **English:**
Missed our latest meetup? <speaker> on <topic> — recording is up! ▶️
🇷🇸 **Srpski:**
Propustili ste poslednji meetup? <speaker> o <topic> — snimak je dostupan! ▶️

Example 3 — Hot-take / debate (for controversial or opinionated talks):
🇬🇧 **English:**
<topic> has been sparking debate in the community. <speaker> shares a fresh perspective in our latest recording. 🔥
🇷🇸 **Srpski:**
<topic> je pokrenuo debatu u zajednici. <speaker> deli svež pogled u našem novom snimku. 🔥

Output format (use exactly this format):
🇬🇧 **English:**
[English text here]

🇷🇸 **Srpski:**
[Serbian text here]`;
}

export function buildAnnouncementPrompt(
  eventTitle: string,
  description: string,
  speakerName: string | null
): string {
  const speakerInfo = speakerName
    ? `- Speaker: ${speakerName}`
    : "- No named speaker (panel, workshop, or community event)";

  return `You are a social media manager for C++ Serbia, a C++ programming community in Belgrade, Serbia.

Write a short, enthusiastic social media post announcing an UPCOMING meetup event. This is an INVITATION to attend — the event has NOT happened yet.

Event details:
- Event title: "${eventTitle}"
- Description: ${description}
${speakerInfo}

Requirements:
- Generate TWO versions: English first, then Serbian (Latin script)
- Each version must be 1-2 sentences and UNDER 200 characters
- Use 1 relevant emoji per version
- Do NOT include any URLs, dates, times, or venue names — those are added separately by the posting system
- The Serbian version should be a natural translation, not word-for-word
- Vary your style — pick whichever hook fits the talk best
- When there's a named speaker, mention them. When there isn't, focus on what attendees will learn or experience

Example styles:

Example 1 — Curiosity / teaser:
🇬🇧 **English:**
Ever wondered how to <topic>? <speaker> has the answers at our next meetup! 💡
🇷🇸 **Srpski:**
Da li ste se ikada pitali kako <topic>? <speaker> ima odgovore! 💡

Example 2 — Direct invitation:
🇬🇧 **English:**
Join us for a deep dive into <topic> with <speaker>! 🚀
🇷🇸 **Srpski:**
Pridružite nam se za <topic> sa <speaker>! 🚀

Example 3 — Topic-focused (no speaker):
🇬🇧 **English:**
How do you move a massive C++ codebase forward? Strategies, tooling, and live Q&A at our next meetup 🎯
🇷🇸 **Srpski:**
Kako unaprediti veliki C++ projekat? Strategije, alati i Q&A na našem sledećem meetup-u 🎯

Output format (use exactly this format):
🇬🇧 **English:**
[English text here]

🇷🇸 **Srpski:**
[Serbian text here]`;
}
