import { getTranslations } from "next-intl/server";

import { EventCard } from "@/components/event-card";
import { getFeaturedEvents } from "@/lib/events-server";
import { isPastEvent } from "@/lib/temporal";

interface FeaturedEventsProps {
  limit?: number;
}

export default async function FeaturedEvents({ limit }: FeaturedEventsProps) {
  const t = await getTranslations("featuredEvents");
  const events = getFeaturedEvents(limit);

  return (
    <div className="grid gap-6">
      {events.length > 0 ? (
        events.map((event) => {
          const isUpcoming = !isPastEvent(event.date);
          return (
            <EventCard
              key={event.slug}
              event={event}
              isUpcoming={isUpcoming}
              isPastEvent={isPastEvent}
            />
          );
        })
      ) : (
        <p className="py-8 text-center text-gray-400">{t("empty")}</p>
      )}
    </div>
  );
}
