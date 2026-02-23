import type { Event } from '@/lib/events-server';
import { getLocale, getTranslations } from "next-intl/server";

interface EventSeoProps {
  event: Event;
  baseUrl?: string;
}

function generateEventDescription(event: Event, t: Awaited<ReturnType<typeof getTranslations>>): string {
  if (event.description && event.description.length > 100) {
    return event.description;
  }

  const eventType = event.isOnline ? t('eventTypeOnline') : t('eventTypeInPerson');
  let desc = t('eventDescriptionJoin', { title: event.title, eventType });

  if (event.location !== 'TBD') {
    desc += event.isOnline
      ? t('eventDescriptionOnline')
      : t('eventDescriptionAtVenue', { venue: event.location });
  }

  desc += t('eventDescriptionConnect');

  if (event.registrationLink) {
    desc += t('eventDescriptionRegister');
  }

  return desc;
}

export async function EventSeo({ event, baseUrl = 'https://cppserbia.org' }: EventSeoProps) {
  const locale = await getLocale();
  const t = await getTranslations('seo');
  const eventUrl = `${baseUrl}/${locale}/events/${event.slug}`;
  const imageUrl = event.imageUrl || `${baseUrl}/images/cpp-serbia-preview.png`;

  const description = generateEventDescription(event, t);

  const startDate = event.startDateTime
    ? event.startDateTime.toString({ timeZoneName: 'never' })
    : event.date.toString();
  const endDate = event.endDateTime
    ? event.endDateTime.toString({ timeZoneName: 'never' })
    : event.date.toString();

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
    "eventStatus": "https://schema.org/EventScheduled",
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
