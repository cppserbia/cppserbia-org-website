import { getAllEventsServer } from '@/lib/events-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const events = getAllEventsServer();
  const baseUrl = 'https://cppserbia.org';

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>C++ Serbia Community Events</title>
    <description>Stay updated with C++ Serbia community events, meetups, workshops, and conferences</description>
    <link>${baseUrl}/events</link>
    <atom:link href="${baseUrl}/events/feed.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${events
      .slice(0, 20) // Limit to 20 most recent events
      .map(
        (event) => `
    <item>
      <title>${event.title}</title>
      <description><![CDATA[${event.description}]]></description>
      <link>${baseUrl}/events/${event.slug}</link>
      <guid>${baseUrl}/events/${event.slug}</guid>
      <pubDate>${new Date(event.startDateTime?.toString() || event.date.toString()).toUTCString()}</pubDate>
      <category>C++</category>
      <category>Programming</category>
      <category>Serbia</category>
      <category>Technology</category>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
