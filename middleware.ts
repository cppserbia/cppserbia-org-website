import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except:
    // - _next (Next.js internals)
    // - static files (images, favicon, etc.)
    // - feed routes (RSS, iCal)
    // - sitemap and robots
    '/((?!_next|images|favicon|feed\\.xml|feed\\.ics|events/feed\\.xml|events/[^/]+/calendar\\.ics|sitemap\\.xml|robots\\.txt|.*\\..*).*)',
  ],
};
