"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";

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
  const isPastEvent = (eventDate: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDateObj = new Date(eventDate);
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
          `[Client] Featured events fetched successfully: ${
            data.events?.length || 0
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
        events.map((event) => (
          <div
            key={event.slug}
            className="border border-purple-900 rounded-lg p-6 bg-[#0c0c1d]/80 hover:border-purple-700 transition-colors"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/4 flex-shrink-0">
                <div className="bg-purple-950 p-3 rounded-lg text-center">
                  <div className="text-sm text-purple-300">{event.month}</div>
                  <div className="text-3xl font-bold">{event.day}</div>
                  <div className="text-sm text-purple-300">{event.year}</div>
                </div>
              </div>
              <div className="md:w-3/4">
                <h3 className="text-xl font-bold mb-2 text-white">
                  {event.title}
                </h3>
                <p className="text-gray-300 mb-4">{event.description}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                    <span>{event.formattedDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-purple-400" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-purple-900 hover:bg-purple-800 rounded-md"
                  >
                    View Details
                  </Link>
                  {event.registrationLink && !isPastEvent(event.date) && (
                    <Link
                      href={event.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 rounded-md"
                    >
                      Register
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400 text-center py-8">
          No featured events at the moment. Check back soon!
        </p>
      )}
    </div>
  );
}
