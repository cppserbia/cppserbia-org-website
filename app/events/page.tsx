import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { getEventsByDate } from "@/lib/events-server";
import { isPastEvent } from "@/lib/events";
import { EventCard } from "@/components/event-card";

export default function EventsPage() {
  // Get events from markdown files
  const { upcomingEvents, pastEvents } = getEventsByDate();

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      {/* Header */}
      <section className="relative w-full py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-400 to-blue-400">
                Events
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl">
                Stay up to date with all C++ Serbia community events, meetups,
                workshops, and conferences.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="C++ Serbia Logo"
                width={120}
                height={120}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-purple-300">
            Upcoming Events
          </h2>
          <div className="grid gap-6">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCard
                  key={event.slug}
                  event={event}
                  isUpcoming={true}
                  isPastEvent={isPastEvent}
                />
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                No upcoming events scheduled yet! Just in case, save the date
                for the last Wednesday of the month.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Past Events Section */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-purple-300">
            Past Events
          </h2>

          <div className="grid gap-6">
            {pastEvents.length > 0 ? (
              pastEvents.map((event) => (
                <EventCard
                  key={event.slug}
                  event={event}
                  isUpcoming={false}
                  isPastEvent={isPastEvent}
                />
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                No past events to display.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
