import { cache } from "react"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { Variable } from "lucide-react"

// Add this constant at the top of the file
const DEFAULT_MEETUP_URL = "https://www.meetup.com/cpp-serbia/"

// Add a check to ensure this code only runs on the server
if (typeof window !== "undefined") {
  throw new Error("This module should only be imported on the server side")
}

export interface MeetupEvent {
  id: string
  title: string
  description: string
  dateTime: string
  endTime: string
  duration: number
  eventUrl: string
  eventType: string
  status: string
  venues?: Array<{
    address: string
    city: string
    country: string
    id: string
    name: string
    postalCode: string
    state: string
    venueType: string
  }>
}

export interface FormattedEvent {
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
  isOnline?: boolean
  imageUrl?: string
  source: "api" | "markdown" // Track the source of the event
  content?: string // Full markdown content for markdown events
}

// Updated GraphQL query that doesn't use the urlname variable
const EVENTS_QUERY = `
query Events($status: EventStatus = PAST) {
  group(id: 21118957) {
    events(status: $status, sort: DESC, first: 6) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        cursor
        node {
          createdTime
          eventType
          dateTime
          description
          duration
          endTime
          eventType
          eventUrl
          id
          status
          title
          venues {
            address
            city
            country
            id
            name
            postalCode
            state
            venueType
          }
        }
      }
    }
  }
}
`

// Function to fetch events from Meetup.com GraphQL API
export const fetchMeetupEvents = cache(async (status: string): Promise<FormattedEvent[]> => {
  try {
    // Get API key from environment variable
    const apiKey = process.env.MEETUP_API_KEY

    if (!apiKey) {
      console.warn("MEETUP_API_KEY not found in environment variables")
      return []
    }

    const response = await fetch("https://api.meetup.com/gql-ext", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: EVENTS_QUERY,
        variables: {
          status: status, // Fetch only upcoming events
        },
      }),
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!response.ok) {
      console.error("Failed to fetch events from Meetup.com", await response.text())
      return []
    }

    const data = await response.json()

    // Check if we have valid data and handle potential errors
    if (data.errors) {
      console.error("GraphQL errors:", data.errors)
      return []
    }

    // Check if we have the expected data structure
    if (!data?.data?.group?.events?.edges) {
      console.error("Invalid response format from Meetup.com", data)
      return []
    }

    // Extract events from the response
    const events: MeetupEvent[] = data.data.group.events.edges.map((edge: any) => edge.node)

    // Format events to match our application's structure
    return events.map((event) => formatMeetupEvent(event))
  } catch (error) {
    console.error("Error fetching events from Meetup.com:", error)
    return []
  }
})

// Function to format Meetup events to match our application's structure
function formatMeetupEvent(event: MeetupEvent): FormattedEvent {
  const eventDate = new Date(event.dateTime)
  const endDate = event.endTime ? new Date(event.endTime) : new Date(eventDate.getTime() + event.duration)

  // Format time range
  const timeFormat: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true }
  const startTime = eventDate.toLocaleTimeString("en-US", timeFormat)
  const endTime = endDate.toLocaleTimeString("en-US", timeFormat)
  const timeRange = `${startTime} - ${endTime}`

  // Format location
  let location = "Online"
  if (event.venues && event.venues.length > 0) {
    const venue = event.venues[0]
    location = `${venue.name}, ${venue.city}`
    if (venue.address) {
      location = `${venue.name}, ${venue.address}, ${venue.city}`
    }
  }

  // Format date for display
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Extract day, month, year for the calendar display
  const day = eventDate.getDate().toString()
  const month = eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase()
  const year = eventDate.getFullYear().toString()

  // Create a slug from the event title
  const slug = `${event.id}-${event.title
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "-")}`

  // Extract a short description (first 200 characters)
  const shortDescription = event.description
    ? event.description.replace(/<[^>]*>/g, "") // Remove HTML tags
    : "No description available"

  // Determine if the event is online
  const isOnline = event.eventType === "ONLINE" || location.toLowerCase().includes("online")

  return {
    slug,
    title: event.title,
    date: eventDate.toISOString().split("T")[0], // YYYY-MM-DD format
    time: timeRange,
    location,
    description: shortDescription.substring(0, 200) + (shortDescription.length > 200 ? "..." : ""),
    registrationLink: event.eventUrl || DEFAULT_MEETUP_URL,
    formattedDate,
    day,
    month,
    year,
    isOnline,
    source: "api",
  }
}

// Function to get all events (upcoming and past) from both sources
export async function getAllEvents() {
  try {
    // Fetch events from both sources in parallel
    const [upcomingEvents, pastEvents] = await Promise.all([fetchMeetupEvents("DRAFT"), fetchMeetupEvents("PAST")])

    console.log(`Fetched ${upcomingEvents.length + pastEvents.length} API events`)

    return {
      upcomingEvents,
      pastEvents,
    }
  } catch (error) {
    console.error("Error fetching events:", error)

    return {
      upcomingEvents: [],
      pastEvents: [],
    }
  }
}
