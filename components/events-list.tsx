"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEvents } from "@/hooks/use-events"
import type { FormattedEvent } from "@/lib/meetup-api"

interface EventsListProps {
  initialEvents?: FormattedEvent[]
  limit?: number
  upcomingOnly?: boolean
  showRefresh?: boolean
}

export default function EventsList({
  initialEvents = [],
  limit,
  upcomingOnly = false,
  showRefresh = false,
}: EventsListProps) {
  // Use the initialEvents for first render, then fetch from API
  const [events, setEvents] = useState<FormattedEvent[]>(initialEvents)
  const { upcomingEvents, isLoading, error, refetch } = useEvents({ limit, upcomingOnly })

  useEffect(() => {
    if (upcomingEvents.length > 0) {
      setEvents(upcomingEvents)
    }
  }, [upcomingEvents])

  return (
    <div>
      {showRefresh && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="text-purple-300 border-purple-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Events
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-500/30 rounded-lg bg-red-950/20 text-red-300 mb-6">
          <p>Error loading events. Please try again later.</p>
        </div>
      )}

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
                  <h3 className="text-xl font-bold mb-2 text-white">{event.title}</h3>
                  <p className="text-gray-300 mb-4">{event.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                      <span>{event.formattedDate}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-400 mr-2">•</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-400 mr-2">•</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {event.source === "api" ? (
                      // For API events, link directly to Meetup.com
                      <Link
                        href={event.registrationLink || "https://www.meetup.com/cpp-serbia/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-purple-900 hover:bg-purple-800 rounded-md"
                      >
                        View on Meetup <ExternalLink className="h-4 w-4 ml-1" />
                      </Link>
                    ) : (
                      // For markdown events, link to our detail page
                      <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-purple-900 hover:bg-purple-800 rounded-md"
                      >
                        View Details
                      </Link>
                    )}
                    {event.registrationLink && event.source === "api" && (
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
            {isLoading ? "Loading events..." : "No events to display at the moment. Check back soon!"}
          </p>
        )}
      </div>
    </div>
  )
}
