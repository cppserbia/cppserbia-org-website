import { MetadataRoute } from 'next';
import { getAllEventsServer } from '@/lib/events-server';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cppserbia.org';
  
  try {
    const allEvents = getAllEventsServer();

    // Static pages
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/events`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ];

    // Event pages
    const eventPages = allEvents.map((event) => {
      let lastModified: Date;
      try {
        // Convert Temporal dates to regular Date objects
        if (event.startDateTime) {
          // Extract components from Temporal.ZonedDateTime
          const { year, month, day, hour, minute, second } = event.startDateTime;
          lastModified = new Date(year, month - 1, day, hour, minute, second);
        } else {
          // Extract components from Temporal.PlainDate
          const { year, month, day } = event.date;
          lastModified = new Date(year, month - 1, day);
        }
      } catch (error) {
        console.warn(`Error creating date for event ${event.slug}:`, error);
        lastModified = new Date(); // Fallback to current date
      }

      return {
        url: `${baseUrl}/events/${event.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      };
    });

    return [...staticPages, ...eventPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return basic sitemap if events can't be loaded
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/events`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ];
  }
}
