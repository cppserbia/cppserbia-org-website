import { getLocale, getTranslations } from "next-intl/server";

import type { Event } from "@/lib/events-server";

interface EventsListSeoProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
  baseUrl?: string;
}

export async function EventsListSeo({
  upcomingEvents,
  pastEvents,
  baseUrl = "https://cppserbia.org",
}: EventsListSeoProps) {
  const locale = await getLocale();
  const t = await getTranslations("seo");
  const eventsUrl = `${baseUrl}/${locale}/events`;
  const totalEvents = upcomingEvents.length + pastEvents.length;

  const description =
    upcomingEvents.length > 0
      ? t("eventsCollectionDescUpcoming", {
          count: upcomingEvents.length,
          firstEvent: upcomingEvents[0]?.title,
          total: totalEvents,
        })
      : t("eventsCollectionDescGeneral", { total: totalEvents });

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("breadcrumbHome"),
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("breadcrumbEvents"),
        item: eventsUrl,
      },
    ],
  };

  const eventsCollectionData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("eventsCollectionName"),
    description: description,
    url: eventsUrl,
    inLanguage: locale === "sr" ? "sr" : "en",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalEvents,
      itemListElement: [...upcomingEvents, ...pastEvents].slice(0, 10).map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Event",
          name: event.title,
          startDate: event.startDateTime
            ? event.startDateTime.toString({ timeZoneName: "never" })
            : event.date.toString(),
          location: {
            "@type": event.isOnline ? "VirtualLocation" : "Place",
            name: event.location,
          },
          url: `${baseUrl}/${locale}/events/${event.slug}`,
        },
      })),
    },
    about: {
      "@type": "Organization",
      name: "C++ Serbia Community",
      url: baseUrl,
    },
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
