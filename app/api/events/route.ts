import { NextResponse } from "next/server"
import { getEventsByDate } from "@/lib/events"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const requestId = `api-events-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  console.log(
    `[${new Date().toISOString()}] [${requestId}] Received request: ${request.method} ${requestUrl.pathname}${requestUrl.search}`,
  )

  try {
    const { searchParams } = requestUrl
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : undefined

    console.log(`[${requestId}] Fetching events with params:`, {
      limit,
      searchParams: Object.fromEntries(searchParams.entries()),
    })

    const { upcomingEvents, pastEvents } = getEventsByDate()

    console.log(`[${requestId}] Events fetched:`, {
      upcomingEventsCount: upcomingEvents.length,
      pastEventsCount: pastEvents.length,
    })

    if (upcomingEvents.length === 0) {
      const events = pastEvents.slice(0, 1)
      console.log(`[${requestId}] No upcoming events, returning past event`, {
        eventsCount: events.length,
      })
      return NextResponse.json({ events })
    } else {
      const events = limit ? upcomingEvents.slice(0, limit) : upcomingEvents
      console.log(`[${requestId}] Returning upcoming events`, {
        eventsCount: events.length,
        totalUpcoming: upcomingEvents.length,
        requestedLimit: limit,
      })
      return NextResponse.json({ events })
    }
  } catch (error) {
    console.error(`[${requestId}] Error fetching events:`, error)

    return NextResponse.json(
      {
        error: "Failed to fetch events",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
