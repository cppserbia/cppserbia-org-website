import { NextResponse } from "next/server"
import { getAllEvents } from "@/lib/meetup-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : undefined

    const { upcomingEvents, pastEvents } = await getAllEvents()

    if (upcomingEvents.length === 0) {
      const events = pastEvents.slice(0, 1)
      return NextResponse.json({ events })
    } else {
      const events = limit ? upcomingEvents.slice(0, limit) : upcomingEvents
      return NextResponse.json({ events })
    }
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
