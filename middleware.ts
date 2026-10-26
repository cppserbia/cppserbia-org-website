import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { unknownEventLocale } from "./lib/event-route";

const intlMiddleware = createMiddleware(routing);

// Inlined at build time by next.config.mjs (the middleware cannot read events/ at runtime).
const publishedEventSlugs = new Set(
  (process.env.PUBLISHED_EVENT_SLUGS ?? "").split(",").filter(Boolean)
);

export default function middleware(request: NextRequest) {
  // Unknown event slugs would otherwise answer 200; see lib/event-route.ts. Skipped in dev,
  // where drafts are visible and new event files appear without a restart.
  if (process.env.NODE_ENV !== "development" && publishedEventSlugs.size > 0) {
    const locale = unknownEventLocale(
      request.nextUrl.pathname,
      routing.locales,
      publishedEventSlugs
    );
    if (locale) {
      // A path that matches no route renders the site's not-found page with a real 404.
      return NextResponse.rewrite(new URL(`/${locale}/404`, request.url));
    }
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except:
    // - _next (Next.js internals)
    // - static files (images, favicon, etc.)
    // - feed routes (RSS, iCal)
    // - sitemap and robots
    "/((?!_next|images|favicon|feed\\.xml|feed\\.ics|events/feed\\.xml|events/[^/]+/calendar\\.ics|sitemap\\.xml|robots\\.txt|.*\\..*).*)",
  ],
};
