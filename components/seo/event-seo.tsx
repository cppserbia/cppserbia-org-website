import type { Event } from '@/lib/events-server';
import { getLocale } from "next-intl/server";

interface EventSeoProps {
  event: Event;
  baseUrl?: string;
}

function generateEventDescription(event: Event): string {
  if (event.description && event.description.length > 100) {
    return event.description;
  }

  const eventType = event.isOnline ? 'online' : 'in-person';
  const baseDescription = `Join C++ Serbia community for "${event.title}" - an ${eventType} event`;

  let enhancedDescription = baseDescription;

  if (event.location !== 'TBD') {
    enhancedDescription += ` taking place ${event.isOnline ? 'online' : `at ${event.location}`}`;
  }

  enhancedDescription += `. Connect with fellow C++ developers, learn about modern C++ techniques, and expand your programming knowledge.`;

  if (event.registrationLink) {
    enhancedDescription += ` Register now to secure your spot!`;
  }

  return enhancedDescription;
}

export async function EventSeo({ event, baseUrl = 'https://cppserbia.org' }: EventSeoProps) {
  const locale = await getLocale();
  const eventUrl = `${baseUrl}/${locale}/events/${event.slug}`;
  const imageUrl = event.imageUrl || `${baseUrl}/images/logo.png`;

  const description = generateEventDescription(event);

  const startDate = event.startDateTime?.toString() || event.date.toString();
  const endDate = event.endDateTime?.toString() || event.date.toString();

  const eventStatus = event.status === 'PAST' ? 'EventCancelled' : 'EventScheduled';
  const eventAttendanceMode = event.isOnline ? 'OnlineEventAttendanceMode' : 'OfflineEventAttendanceMode';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": startDate,
    "endDate": endDate,
    "location": {
      "@type": event.isOnline ? "VirtualLocation" : "Place",
      "name": event.location,
      ...(event.isOnline ? { "url": eventUrl } : { "address": event.location })
    },
    "description": description,
    "url": eventUrl,
    "image": imageUrl,
    "organizer": {
      "@type": "Organization",
      "name": "C++ Serbia Community",
      "url": baseUrl
    },
    "eventStatus": `https://schema.org/${eventStatus}`,
    "eventAttendanceMode": `https://schema.org/${eventAttendanceMode}`,
    "inLanguage": locale === 'sr' ? 'sr' : 'en',
    ...(event.registrationLink && {
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "url": event.registrationLink,
        "availability": "https://schema.org/InStock"
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}
