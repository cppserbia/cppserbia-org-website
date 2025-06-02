import type { Event } from '@/lib/events-server';

interface EventsListSeoProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
  baseUrl?: string;
}

export function EventsListSeo({ upcomingEvents, pastEvents, baseUrl = 'https://cppserbia.org' }: EventsListSeoProps) {
  const eventsUrl = `${baseUrl}/events`;
  const totalEvents = upcomingEvents.length + pastEvents.length;
  
  // Create description with dynamic content
  const description = upcomingEvents.length > 0 
    ? `Join C++ Serbia community events! ${upcomingEvents.length} upcoming events including ${upcomingEvents[0]?.title}. View all ${totalEvents} C++ meetups, workshops, and conferences in Serbia.`
    : `Explore ${totalEvents} C++ Serbia community events. Join our vibrant community of C++ developers in Serbia through meetups, workshops, and conferences.`;

  // Create breadcrumb structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Events",
        "item": eventsUrl
      }
    ]
  };

  // Create events collection structured data
  const eventsCollectionData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "C++ Serbia Community Events",
    "description": description,
    "url": eventsUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalEvents,
      "itemListElement": [...upcomingEvents, ...pastEvents].slice(0, 10).map((event, index) => ({
        "@type": "Event",
        "position": index + 1,
        "name": event.title,
        "startDate": event.startDateTime?.toString() || event.date.toString(),
        "location": {
          "@type": event.isOnline ? "VirtualLocation" : "Place",
          "name": event.location
        },
        "url": `${baseUrl}/events/${event.slug}`
      }))
    },
    "about": {
      "@type": "Organization",
      "name": "C++ Serbia Community",
      "url": baseUrl
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData, null, 2),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventsCollectionData, null, 2),
        }}
      />
    </>
  );
}
