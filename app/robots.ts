import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/admin/', '/events/feed.xml', '/feed.xml', '/feed.ics'],
    },
    sitemap: 'https://cppserbia.org/sitemap.xml',
  };
}
