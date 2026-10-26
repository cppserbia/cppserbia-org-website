/**
 * For `/{locale}/events/{slug}` where the slug is not a published event, the locale to
 * render the 404 in; otherwise null. Used by the middleware: Serbian pages read the script
 * cookie, so they render on request, and the loading.tsx boundary commits a 200 before the
 * page can call notFound(). Social crawlers that hit a new event before its deploy would
 * then cache the generic page as a valid link preview.
 */
export function unknownEventLocale(
  pathname: string,
  locales: readonly string[],
  publishedSlugs: ReadonlySet<string>
): string | null {
  const match = pathname.match(/^\/([^/]+)\/events\/([^/]+)\/?$/);
  if (!match || !locales.includes(match[1])) return null;

  let slug: string;
  try {
    slug = decodeURIComponent(match[2]);
  } catch {
    return match[1];
  }
  return publishedSlugs.has(slug) ? null : match[1];
}
