import { MetadataRoute } from 'next';
import { getAllEventsServer } from '@/lib/events-server';
import { locales } from '@/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cppserbia.org';

  try {
    const allEvents = getAllEventsServer();

    const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) => [
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: locale === 'en' ? 1 : 0.9,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}`])
          ),
        },
      },
      {
        url: `${baseUrl}/${locale}/events`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: locale === 'en' ? 0.9 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}/events`])
          ),
        },
      },
    ]);

    const eventPages: MetadataRoute.Sitemap = allEvents.flatMap((event) => {
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

      return locales.map((locale) => ({
        url: `${baseUrl}/${locale}/events/${event.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}/events/${event.slug}`])
          ),
        },
      }));
    });

    return [...staticPages, ...eventPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return locales.flatMap((locale) => [
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/${locale}/events`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ]);
  }
}
