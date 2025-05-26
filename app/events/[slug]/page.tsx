import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react"
import { getEventBySlug, getAllEvents } from "@/lib/events"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = getEventBySlug(params.slug)

  if (!event) {
    return {
      title: "Event Not Found - C++ Serbia Community",
    }
  }

  return {
    title: `${event.title} - C++ Serbia Community`,
    description: event.description,
  }
}

// Generate static params for all events
export function generateStaticParams() {
  const allEvents = getAllEvents()

  return allEvents.map((event) => ({
    slug: event.slug,
  }))
}

export default function EventPage({ params }: { params: { slug: string } }) {
  const event = getEventBySlug(params.slug)

  if (!event) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      {/* Header */}
      <section className="relative w-full py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link href="/events" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Events
          </Link>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-400 to-blue-400">
                {event.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 text-sm text-gray-400">
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
            </div>
            <div className="flex-shrink-0">
              <div className="bg-purple-950 p-3 rounded-lg text-center">
                <div className="text-sm text-purple-300">{event.month}</div>
                <div className="text-3xl font-bold">{event.day}</div>
                <div className="text-sm text-purple-300">{event.year}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Content */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="border border-purple-900 rounded-lg p-8 bg-[#0c0c1d]/80">
            {event.imageUrl && (
              <div className="mb-8">
                <Image
                  src={event.imageUrl || "/placeholder.svg"}
                  alt={event.title}
                  width={1200}
                  height={600}
                  className="rounded-lg w-full object-cover"
                />
              </div>
            )}

            {event.content ? (
              <div className="prose prose-invert prose-purple max-w-none">
                <ReactMarkdown>{event.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="prose prose-invert prose-purple max-w-none">
                <p>{event.description}</p>
              </div>
            )}

            {event.registrationLink && (
              <div className="mt-8">
                <Link
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 rounded-md"
                >
                  Register for this Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
