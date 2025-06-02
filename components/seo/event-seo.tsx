import type { Event } from '@/lib/events-server';

interface EventSeoProps {
  event: Event;
  baseUrl?: string;
}

// Local utility functions for SEO
function generateEventKeywords(event: Event): string {
  const baseKeywords = [
    'C++',
    'programming',
    'Serbia',
    'Belgrade',
    'meetup',
    'technology',
    'software development',
    'community'
  ];

  const eventSpecificKeywords: string[] = [];

  // Extract keywords from title
  const titleWords = event.title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['the', 'and', 'for', 'with', 'from', 'this', 'that'].includes(word));
  
  eventSpecificKeywords.push(...titleWords);

  // Add location-based keywords
  if (event.location.toLowerCase().includes('online')) {
    eventSpecificKeywords.push('online event', 'virtual meetup', 'remote learning');
  } else {
    eventSpecificKeywords.push('physical event', 'in-person meetup');
  }

  // Combine and deduplicate
  const allKeywords = [...baseKeywords, ...eventSpecificKeywords];
  const uniqueKeywords = Array.from(new Set(allKeywords));

  return uniqueKeywords.join(', ');
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

export function EventSeo({ event, baseUrl = 'https://cppserbia.org' }: EventSeoProps) {
  const eventUrl = `${baseUrl}/events/${event.slug}`;
  const imageUrl = event.imageUrl || `${baseUrl}/images/logo.png`;
  
  // Generate enhanced description and keywords
  const description = generateEventDescription(event);
  const keywords = generateEventKeywords(event);
  
  // Convert Temporal dates to ISO strings for JSON-LD
  const startDate = event.startDateTime?.toString() || event.date.toString();
  const endDate = event.endDateTime?.toString() || event.date.toString();
  
  // Determine event status
  const eventStatus = event.status === 'PAST' ? 'EventCancelled' : 'EventScheduled';
  const eventAttendanceMode = event.isOnline ? 'OnlineEventAttendanceMode' : 'OfflineEventAttendanceMode';

  // Create structured data for the event
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
