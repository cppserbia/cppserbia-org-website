import { Feed } from 'feed';
import { getAllEventsServer } from '@/lib/events-server';

export async function GET() {
  const allEvents = getAllEventsServer();
  const siteUrl = 'https://cppserbia.org';

  const feed = new Feed({
    title: 'C++ Serbia Events',
    description: 'Upcoming and past events from the C++ Serbia user group',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    image: `${siteUrl}/images/logo.png`, // Assuming there is a logo
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, C++ Serbia`,
    updated: new Date(), // Optional, default = today
    generator: 'Feed for Node.js',
    feedLinks: {
      rss2: `${siteUrl}/feed.xml`,
    },
    author: {
      name: 'C++ Serbia',
      email: 'info@cppserbia.org',
      link: siteUrl,
    },
  });

  allEvents.forEach((event) => {
    let date: Date;
    try {
      if (event.startDateTime) {
        const { year, month, day, hour, minute, second } = event.startDateTime;
        date = new Date(year, month - 1, day, hour, minute, second);
      } else {
        const { year, month, day } = event.date;
        date = new Date(year, month - 1, day);
      }
    } catch (error) {
      console.warn(`Error creating date for event ${event.slug}:`, error);
      date = new Date();
    }

    feed.addItem({
      title: event.title,
      id: `${siteUrl}/events/${event.slug}`,
      link: `${siteUrl}/events/${event.slug}`,
      description: event.description,
      content: event.content,
      author: [
        {
          name: 'C++ Serbia',
          email: 'info@cppserbia.org',
          link: siteUrl,
        },
      ],
      date: date,
      image: event.imageUrl ? (event.imageUrl.startsWith('http') ? event.imageUrl : `${siteUrl}${event.imageUrl}`) : undefined,
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
