import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, MapPin, Clock, ArrowLeft } from "lucide-react"
import { getAllEvents } from "@/lib/meetup-api"

interface EventPageProps {
  params: {
    slug: string
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = params
  const { upcomingEvents, pastEvents } = await getAllEvents()
  const allEvents = [...upcomingEvents, ...pastEvents]

  // Only find markdown events - API events should redirect to Meetup.com
  const event = allEvents.find((event) => event.slug === slug && event.source === "markdown")

  if (!event) {
    notFound()
  }

  const isUpcoming = upcomingEvents.some((e) => e.slug === slug)

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      {/* Header */}
      <section className="relative w-full py-16 px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link href="/events" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Events
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/4 flex-shrink-0">
              <div className="bg-purple-950 p-4 rounded-lg text-center">
                <div className="text-sm text-purple-300">{event.month}</div>
                <div className="text-4xl font-bold">{event.day}</div>
                <div className="text-sm text-purple-300">{event.year}</div>
              </div>
            </div>

            <div className="md:w-3/4">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{event.title}</h1>

              <div className="flex flex-col gap-3 mb-6 text-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-purple-400" />
                  <span>{event.formattedDate}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-purple-400" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-purple-400" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert max-w-none">
            {event.content && <div dangerouslySetInnerHTML={{ __html: markdownToHtml(event.content) }} />}
          </div>
        </div>
      </section>
    </div>
  )
}

// Simple function to convert markdown to HTML
function markdownToHtml(markdown: string): string {
  // This is a very basic implementation
  // In a real app, you'd use a proper markdown parser like remark
  return markdown
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />")
}

// Generate static paths for markdown events only
export async function generateStaticParams() {
  const { upcomingEvents, pastEvents } = await getAllEvents()
  const allEvents = [...upcomingEvents, ...pastEvents]

  // Only generate pages for markdown events
  return allEvents
    .filter((event) => event.source === "markdown")
    .map((event) => ({
      slug: event.slug,
    }))
}
