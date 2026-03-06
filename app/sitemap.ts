import { MetadataRoute } from 'next';
import { getAllEventsServer } from '@/lib/events-server';
import { locales } from '@/i18n/config';

function hreflangAlternates(path: string, baseUrl: string) {
  return {
    languages: Object.fromEntries(
      [...locales.map((l) => [l, `${baseUrl}/${l}${path}`]), ['x-default', `${baseUrl}/en${path}`]]
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cppserbia.org';

  try {
    const allEvents = getAllEventsServer();

    const staticPages: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/en`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
        alternates: hreflangAlternates('', baseUrl),
      },
      {
        url: `${baseUrl}/en/events`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
        alternates: hreflangAlternates('/events', baseUrl),
      },
    ];

    const eventPages: MetadataRoute.Sitemap = allEvents.map((event) => {
      let lastModified: Date;
      try {
        if (event.startDateTime) {
          const { year, month, day, hour, minute, second } = event.startDateTime;
          lastModified = new Date(year, month - 1, day, hour, minute, second);
        } else {
          const { year, month, day } = event.date;
          lastModified = new Date(year, month - 1, day);
        }
      } catch {
        lastModified = new Date();
      }

      return {
        url: `${baseUrl}/en/events/${event.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: hreflangAlternates(`/events/${event.slug}`, baseUrl),
      };
    });

    return [...staticPages, ...eventPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [
      {
        url: `${baseUrl}/en`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/en/events`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ];
  }
}
