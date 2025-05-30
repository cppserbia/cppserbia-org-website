import { EventCard } from "@/components/event-card";
import { isPastEvent } from "@/lib/temporal";
import { getFeaturedEvents } from "@/lib/events-server";

interface FeaturedEventsProps {
  limit?: number;
}

export default function FeaturedEvents({ limit }: FeaturedEventsProps) {
  // Get featured events directly from server-side function
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
        <p className="text-gray-400 text-center py-8">
          No featured events at the moment. Check back soon!
        </p>
      )}
    </div>
  );
}
