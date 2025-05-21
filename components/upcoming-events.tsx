"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react"

interface UpcomingEventsProps {
  limit?: number
}

interface Event {
  slug: string
  title: string
  date: string
  time: string
  location: string
  description: string
  registrationLink?: string
  formattedDate: string
  day: string
  month: string
  year: string
  source: "api" | "markdown"
}

export default function UpcomingEvents({ limit }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        params.append("upcomingOnly", "true")

        if (limit) {
          params.append("limit", limit.toString())
        }

        const response = await fetch(`/api/events?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch events")
        }

        const data = await response.json()
        setEvents(data.events || [])
      } catch (err) {
        console.error("Error fetching events:", err)
        setError(err instanceof Error ? err : new Error(String(err)))

        // Fallback to sample data if API fails
        setEvents(getSampleEvents(limit))
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [limit])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && events.length === 0) {
    return (
      <div className="p-4 border border-red-500/30 rounded-lg bg-red-950/20 text-red-300 mb-6">
        <p>Error loading events. Using sample data instead.</p>
      </div>
    )
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
                <h3 className="text-xl font-bold mb-2 text-white">{event.title}</h3>
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
        <p className="text-gray-400 text-center py-8">No upcoming events at the moment. Check back soon!</p>
      )}
    </div>
  )
}

// Sample events data as fallback
function getSampleEvents(limit?: number): Event[] {
  const events = [
    {
      slug: "cpp20-features-deep-dive",
      title: "C++20 Features Deep Dive",
      date: "2025-06-15",
      time: "18:00 - 20:00",
      location: "Belgrade Tech Hub",
      description:
        "An in-depth exploration of the new features in C++20 and how to use them effectively in your projects.",
      registrationLink: "#",
      formattedDate: "June 15, 2025",
      day: "15",
      month: "JUN",
      year: "2025",
      source: "markdown" as const,
    },
    {
      slug: "high-performance-systems",
      title: "Building High-Performance Systems with C++",
      date: "2025-07-05",
      time: "17:30 - 19:30",
      location: "Online",
      description: "Learn how to design and implement high-performance systems using modern C++ techniques.",
      registrationLink: "#",
      formattedDate: "July 5, 2025",
      day: "5",
      month: "JUL",
      year: "2025",
      source: "markdown" as const,
    },
    {
      slug: "game-development-workshop",
      title: "C++ for Game Development Workshop",
      date: "2025-07-22",
      time: "10:00 - 16:00",
      location: "Novi Sad Innovation Hub",
      description:
        "A full-day workshop on using C++ for game development, covering performance optimization, memory management, and more.",
      registrationLink: "#",
      formattedDate: "July 22, 2025",
      day: "22",
      month: "JUL",
      year: "2025",
      source: "markdown" as const,
    },
    {
      slug: "cpp-machine-learning",
      title: "C++ and Machine Learning",
      date: "2025-08-10",
      time: "18:00 - 20:00",
      location: "Belgrade Tech Hub",
      description: "Exploring the intersection of C++ and machine learning, with practical examples and case studies.",
      registrationLink: "#",
      formattedDate: "August 10, 2025",
      day: "10",
      month: "AUG",
      year: "2025",
      source: "markdown" as const,
    },
  ]

  return limit ? events.slice(0, limit) : events
}
