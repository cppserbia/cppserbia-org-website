import fs from "fs";
import matter from "gray-matter";
import isBot from "next/dist/shared/lib/router/utils/is-bot.js";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// The event slugs the middleware lets through (see middleware.ts): the same set
// lib/events-server.ts serves in production, i.e. every event file except drafts.
function publishedEventSlugs() {
  const dir = path.join(process.cwd(), "events");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .filter((file) => matter(fs.readFileSync(path.join(dir, file), "utf8")).data.status !== "DRAFT")
    .map((file) => file.replace(/\.md$/, ""));
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    PUBLISHED_EVENT_SLUGS: publishedEventSlugs().join(","),
  },
  // Crawlers that get metadata rendered into <head> rather than streamed into <body>.
  // Setting this replaces Next's default list, so extend it: Telegram builds its link
  // previews from the event page and is not on the default list.
  htmlLimitedBots: new RegExp(`${isBot.HTML_LIMITED_BOT_UA_RE_STRING}|TelegramBot`),
  // The OG image route reads these from disk; file tracing doesn't follow its
  // path.join(process.cwd(), …), so without this they are missing from the deployed function.
  outputFileTracingIncludes: {
    "/[locale]/events/[slug]/opengraph-image": [
      "./assets/fonts/Rubik-Bold.ttf",
      "./public/images/logo.png",
    ],
  },
  transpilePackages: ["react-markdown"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.cppserbia.org" },
      { protocol: "https", hostname: "secure.meetupstatic.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // wallpaper.png is 6144x3456 (~21 MP); keep transforms rare.
    minimumCacheTTL: 2678400, // 31 days
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
