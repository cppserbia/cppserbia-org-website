import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import EventFallbackNotice from "@/components/event-fallback-notice"
import { getAllEvents } from "@/lib/meetup-api"
import { Calendar, ExternalLink } from "lucide-react"

export default async function EventsPage() {
  // Server-side initial data fetch
  const { upcomingEvents, pastEvents } = await getAllEvents()

  // Check if we're only showing markdown events (API failed)
  const showFallbackNotice = pastEvents.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      {/* Header */}
      <section className="relative w-full py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-400 to-blue-400">
                Events
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl">
                Stay up to date with all C++ Serbia community events, meetups, workshops, and conferences.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Image src="/images/logo.png" alt="C++ Serbia Logo" width={120} height={120} />
            </div>
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {showFallbackNotice && <EventFallbackNotice />}

          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-purple-300">Upcoming Events</h2>
          <div className="grid gap-6">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
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
              <p className="text-gray-400 text-center py-8">No upcoming events scheduled yet! Just in case, save the date for the last Wednesday of the month.</p>
            )}
          </div>
        </div>
      </section>

      {/* Past Events Section */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-purple-300">Past Events</h2>

          <div className="grid gap-6">
            {pastEvents.length > 0 ? (
              pastEvents.map((event) => (
                <div key={event.slug} className="border border-purple-900 rounded-lg p-6 bg-[#0c0c1d]/80">
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
                      <div className="flex items-center text-sm text-gray-400 mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {event.formattedDate} • {event.time} • {event.location}
                        </span>
                      </div>
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
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No past events to display.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
