import { NextResponse } from "next/server"
import { getAllEvents, getUpcomingEvents } from "@/lib/meetup-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : undefined
    const upcomingOnly = searchParams.get("upcomingOnly") === "true"

    if (upcomingOnly) {
      const events = await getUpcomingEvents(limit)
      return NextResponse.json({ events })
    } else {
      const { upcomingEvents, pastEvents } = await getAllEvents()
      return NextResponse.json({ upcomingEvents, pastEvents })
    }
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
