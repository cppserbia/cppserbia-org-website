import { createEvents, DateArray, EventAttributes } from "ics";
import { NextRequest } from "next/server";

import { getEventBySlug } from "@/lib/events-server";
import { toUtcDateArray } from "@/lib/temporal";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const siteUrl = "https://cppserbia.org";

  let start: DateArray;
  let end: DateArray;

  try {
    if (event.startDateTime) {
      start = toUtcDateArray(event.startDateTime);

      if (event.endDateTime) {
        end = toUtcDateArray(event.endDateTime);
      } else {
        // Default to 2 hours if no end time
        const endDate = event.startDateTime.add({ hours: 2 });
        end = toUtcDateArray(endDate);
      }
    } else {
      const { year, month, day } = event.date;
      start = [year, month, day];
      end = [year, month, day]; // All day event
    }
  } catch (error) {
    console.warn(`Error creating date for event ${event.slug}:`, error);
    const now = new Date();
    start = [
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
    ];
    end = [
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      now.getUTCHours() + 1,
      now.getUTCMinutes(),
    ];
  }

  const icsEvent: EventAttributes = {
    start,
    end,
    startInputType: "utc",
    startOutputType: "utc",
    endInputType: "utc",
    endOutputType: "utc",
    title: event.title,
    description: event.description,
    location: event.location,
    url: `${siteUrl}/events/${event.slug}`,
    uid: `${siteUrl}/events/${event.slug}`,
    categories: ["C++"],
    organizer: { name: "C++ Serbia", email: "info@cppserbia.org" },
  };

  const { error, value } = createEvents([icsEvent]);

  if (error) {
    console.error("Error generating ICS file:", error);
    return new Response("Error generating ICS file", { status: 500 });
  }

  return new Response(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
