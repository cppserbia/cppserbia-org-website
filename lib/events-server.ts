import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { Temporal } from '@js-temporal/polyfill'
import { dateToPlainDate, dateToZonedDateTime, formatEventDate, formatEventTime, today, sortEventsByDate } from "./temporal"

// This file contains server-side only functions for reading events
// These functions should only be used in server components or API routes

export interface Event {
  slug: string
  title: string
  date: Temporal.PlainDate
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
  content?: string
  featured?: boolean
  status?: string
  youtube?: string
  startDateTime?: Temporal.ZonedDateTime
  endDateTime?: Temporal.ZonedDateTime
}

interface EventHeader {
  title: string
  date: Date
  created?: string
  event_type?: string
  status?: string
  duration?: string
  end_time?: Date
  event_url?: string
  event_id?: string | number
  venues?: string[]
  location?: string
  description?: string
  registrationLink?: string
  imageUrl?: string
  isOnline?: boolean
  featured?: boolean
  youtube?: string
}

const eventsDirectory = path.join(process.cwd(), "events")

// Helper function to check if we're in development mode
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Helper function to filter out draft events in production
function shouldIncludeEvent(event: Event): boolean {
  // In development, show all events including drafts
  if (isDevelopment()) {
    return true
  }

  // In production, exclude draft events
  return event.status !== 'DRAFT'
}

function parseEventFile(fileName: string): Event | null {
  try {
    const filePath = path.join(eventsDirectory, fileName)
    const fileContents = fs.readFileSync(filePath, "utf8")

    // Parse frontmatter and content
    const { data, content } = matter(fileContents)
    const eventHeader = data as EventHeader

    // Create Temporal objects from Date objects
    const eventDate = eventHeader.date
    const eventPlainDate = dateToPlainDate(eventDate)
    const eventStartDateTime = dateToZonedDateTime(eventDate)

    // Extract day, month, year for the calendar display using Temporal
    const { formattedDate, day, month, year } = formatEventDate(eventPlainDate)

    // Create a slug from the filename without the extension
    const slug = fileName.replace(/\.md$/, "")

    // Extract time using Temporal
    let time = "TBD"
    let endDateTime: Temporal.ZonedDateTime | undefined

    try {
      if (eventHeader.end_time) {
        endDateTime = dateToZonedDateTime(eventHeader.end_time)
        time = formatEventTime(eventStartDateTime, endDateTime)
      } else {
        // Default to 2 hours duration if no end time is specified
        endDateTime = eventStartDateTime.add({ hours: 2 })
        time = formatEventTime(eventStartDateTime)
      }
    } catch (error) {
      console.warn(`Error parsing time from date ${eventHeader.date}:`, error)
      time = "TBD"
    }

    // Extract location from venues array or location field
    let location = "TBD"
    if (eventHeader.venues && eventHeader.venues.length > 0) {
      // venues is an array like: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
      const venueString = eventHeader.venues[0]
      const venueParts = venueString.split(", ")
      if (venueParts.length >= 2) {
        // Extract venue name and city
        location = `${venueParts[0]}, ${venueParts[1]}`
      } else {
        location = venueString
      }
    } else if (eventHeader.location) {
      location = eventHeader.location
    }

    // Determine if event is online based on event_type or location
    const isOnline = eventHeader.event_type === "ONLINE" ||
      location.toLowerCase().includes("online") ||
      eventHeader.isOnline || false

    // Extract description from content (first paragraph after title)
    let description = eventHeader.description || ""
    if (!description && content) {
      // Extract first meaningful paragraph from content
      const lines = content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('-') && trimmed.length > 50) {
          description = trimmed.substring(0, 200) + (trimmed.length > 200 ? "..." : "")
          break
        }
      }
    }

    // Determine if event is featured
    // Only use explicit featured flag from frontmatter
    const featured = eventHeader.featured === true

    return {
      slug,
      title: eventHeader.title,
      date: eventPlainDate,
      time,
      location,
      description,
      registrationLink: eventHeader.registrationLink || eventHeader.event_url,
      formattedDate,
      day,
      month,
      year,
      isOnline,
      imageUrl: eventHeader.imageUrl,
      content, // Include the full markdown content
      featured,
      status: eventHeader.status,
      youtube: eventHeader.youtube,
      startDateTime: eventStartDateTime,
      endDateTime,
    }
  } catch (error) {
    console.error(`Error parsing event file ${fileName}:`, error)
    return null
  }
}

export function getAllEventsServer(): Event[] {
  try {
    if (!fs.existsSync(eventsDirectory)) {
      console.warn("Events directory does not exist:", eventsDirectory)
      return []
    }

    const fileNames = fs.readdirSync(eventsDirectory)
    const markdownFiles = fileNames.filter(
      (fileName) => fileName.endsWith(".md") && !fileName.startsWith("_")
    )

    const allEvents = markdownFiles
      .map((fileName) => parseEventFile(fileName))
      .filter((event): event is Event => event !== null)
      .filter(shouldIncludeEvent) // Filter out draft events in production

    // Sort events by date (newest first) using Temporal
    return sortEventsByDate(allEvents, 'desc')
  } catch (error) {
    console.error("Error reading events directory:", error)
    return []
  }
}

export function getFeaturedEvents(limit?: number): Event[] {
  const allEvents = getAllEventsServer()

  return allEvents.slice(0, limit || 3)
}

export function getEventsByDate(): { upcomingEvents: Event[]; pastEvents: Event[] } {
  const allEvents = getAllEventsServer()
  const todayPlain = today()

  const upcomingEvents = allEvents.filter((event) => {
    return Temporal.PlainDate.compare(event.date, todayPlain) >= 0
  })
  const pastEvents = allEvents.filter((event) => {
    return Temporal.PlainDate.compare(event.date, todayPlain) < 0
  })

  // Sort upcoming events by date (ascending - earliest first)
  const sortedUpcoming = sortEventsByDate(upcomingEvents, 'asc')

  // Sort past events by date (descending - most recent first)
  const sortedPast = sortEventsByDate(pastEvents, 'desc')

  return {
    upcomingEvents: sortedUpcoming,
    pastEvents: sortedPast,
  }
}

export function getEventBySlug(slug: string): Event | null {
  try {
    const fileName = `${slug}.md`
    const eventsDirectory = path.join(process.cwd(), "events")
    const filePath = path.join(eventsDirectory, fileName)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Event file not found: ${filePath}`)
      return null
    }

    const event = parseEventFile(fileName)

    // Check if we should include this event based on environment and status
    if (event && !shouldIncludeEvent(event)) {
      console.warn(`Event ${slug} is a draft and not available in production`)
      return null
    }

    return event
  } catch (error) {
    console.error(`Error getting event by slug ${slug}:`, error)
    return null
  }
}
