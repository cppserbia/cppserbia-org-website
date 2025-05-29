"use client";

import { useState, useEffect } from "react";
import { EventCard } from "@/components/event-card";

interface FeaturedEventsProps {
  limit?: number;
}

interface Event {
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  registrationLink?: string;
  formattedDate: string;
  day: string;
  month: string;
  year: string;
  isOnline?: boolean;
  featured?: boolean;
}

export default function FeaturedEvents({ limit }: FeaturedEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to check if an event is past
  const isPastEvent = (eventDate: string | Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDateObj = eventDate instanceof Date ? eventDate : new Date(eventDate);
    return eventDateObj < today;
  };

  useEffect(() => {
    const loadFeaturedEvents = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (limit) {
          params.append("limit", limit.toString());
        }

        const url = `/api/featured-events?${params.toString()}`;
        console.log(`[Client] Fetching featured events from: ${url}`);

        const startTime = performance.now();
        const response = await fetch(url);
        const endTime = performance.now();

        console.log(
          `[Client] Response received in ${Math.round(
            endTime - startTime
          )}ms with status: ${response.status} ${response.statusText}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Client] Error response: ${errorText}`);
          throw new Error(
            `Failed to fetch featured events: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(
          `[Client] Featured events fetched successfully: ${data.events?.length || 0
          } events`
        );
        setEvents(data.events || []);
      } catch (err) {
        console.error("[Client] Error loading featured events:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedEvents();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/30 rounded-lg bg-red-950/20 text-red-300 mb-6">
        <p>Error loading featured events: {error.message}</p>
        <p className="text-sm mt-2">
          Please check the events directory or contact support if the problem
          persists.
        </p>
      </div>
    );
  }

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
