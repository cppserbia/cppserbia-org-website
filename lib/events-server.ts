import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { start } from "repl"

// This file contains server-side only functions for reading events
// These functions should only be used in server components or API routes

export interface Event {
  slug: string
  title: string
  date: Date
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
}

interface EventFrontmatter {
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
}

const eventsDirectory = path.join(process.cwd(), "events")

function parseEventFile(fileName: string): Event | null {
  try {
    const filePath = path.join(eventsDirectory, fileName)
    const fileContents = fs.readFileSync(filePath, "utf8")

    // Parse frontmatter and content
    const { data, content } = matter(fileContents)
    const frontmatter = data as EventFrontmatter

    // Create a date object for formatting
    const eventDate = frontmatter.date

    // Extract day, month, year for the calendar display
    const day = eventDate.getDate().toString()
    const month = eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase()
    const year = eventDate.getFullYear().toString()

    // Format the date for display
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Create a slug from the filename without the extension
    const slug = fileName.replace(/\.md$/, "")

    // Extract time from frontmatter.date if it's in ISO format, or use time field
    let time = "TBD"
    try {
        const timeFormat: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true }
        const startTime = eventDate.toLocaleTimeString("en-US", timeFormat)
        const endDate = frontmatter.end_time ? frontmatter.end_time : new Date(new Date(eventDate).setHours(eventDate.getHours() + 2));
        const endTime = endDate.toLocaleTimeString("en-US", timeFormat)
    } catch (error) {
        console.warn(`Error parsing time from date ${frontmatter.date}:`, error)
        time = "TBD"
    }


    // Extract location from venues array or location field
    let location = "TBD"
    if (frontmatter.venues && frontmatter.venues.length > 0) {
      // venues is an array like: ['Palata "Beograd" ("Beograđanka"), Beograd, rs']
      const venueString = frontmatter.venues[0]
      const venueParts = venueString.split(", ")
      if (venueParts.length >= 2) {
        // Extract venue name and city
        location = `${venueParts[0]}, ${venueParts[1]}`
      } else {
        location = venueString
      }
    } else if (frontmatter.location) {
      location = frontmatter.location
    }

    // Determine if event is online based on event_type or location
    const isOnline = frontmatter.event_type === "ONLINE" ||
      location.toLowerCase().includes("online") ||
      frontmatter.isOnline || false

    // Extract description from content (first paragraph after title)
    let description = frontmatter.description || ""
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
    // By default, upcoming events and current year events are featured
    const currentYear = new Date().getFullYear()
    const eventYear = eventDate.getFullYear()
    const isUpcoming = eventDate >= new Date()
    const featured = frontmatter.featured !== undefined
      ? frontmatter.featured
      : (isUpcoming || eventYear >= currentYear)

    return {
      slug,
      title: frontmatter.title,
      date: eventDate,
      time,
      location,
      description,
      registrationLink: frontmatter.registrationLink || frontmatter.event_url,
      formattedDate,
      day,
      month,
      year,
      isOnline,
      imageUrl: frontmatter.imageUrl,
      content, // Include the full markdown content
      featured,
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
    const markdownFiles = fileNames.filter((fileName) => fileName.endsWith(".md"))

    const allEvents = markdownFiles
      .map((fileName) => parseEventFile(fileName))
      .filter((event): event is Event => event !== null)

    // Sort events by date (newest first)
    return allEvents.sort((a, b) => {
      if (a.date < b.date) return 1
      if (a.date > b.date) return -1
      return 0
    })
  } catch (error) {
    console.error("Error reading events directory:", error)
    return []
  }
}

export function getFeaturedEventsServer(limit?: number): Event[] {
  const allEvents = getAllEventsServer()

  // First try to get explicitly featured events
  const explicitlyFeatured = allEvents.filter((event) => event.featured)

  // If we have explicitly featured events, use them
  if (explicitlyFeatured.length > 0) {
    // Sort featured events by date (upcoming first, then past events in reverse chronological order)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0]

    const upcomingFeatured = explicitlyFeatured.filter((event) => {
      const eventDateStr = event.date.toISOString().split("T")[0]
      return eventDateStr >= today
    })
    const pastFeatured = explicitlyFeatured.filter((event) => {
      const eventDateStr = event.date.toISOString().split("T")[0]
      return eventDateStr < today
    })

    // Sort upcoming events by date (ascending - earliest first)
    upcomingFeatured.sort((a, b) => {
      const aDateStr = a.date.toISOString().split("T")[0]
      const bDateStr = b.date.toISOString().split("T")[0]
      return aDateStr.localeCompare(bDateStr)
    })

    // Sort past events by date (descending - most recent first)
    pastFeatured.sort((a, b) => {
      const aDateStr = a.date.toISOString().split("T")[0]
      const bDateStr = b.date.toISOString().split("T")[0]
      return bDateStr.localeCompare(aDateStr)
    })

    // Combine: upcoming events first, then recent past events
    const sortedFeatured = [...upcomingFeatured, ...pastFeatured]

    if (limit && limit > 0) {
      return sortedFeatured.slice(0, limit)
    }

    return sortedFeatured
  }

  // Fallback: if no explicitly featured events, show upcoming events or recent past events
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0]

  const upcomingEvents = allEvents.filter((event) => {
    const eventDateStr = event.date.toISOString().split("T")[0]
    return eventDateStr >= today
  })
  const pastEvents = allEvents.filter((event) => {
    const eventDateStr = event.date.toISOString().split("T")[0]
    return eventDateStr < today
  })

  // Sort upcoming events by date (ascending - earliest first)
  upcomingEvents.sort((a, b) => {
    const aDateStr = a.date.toISOString().split("T")[0]
    const bDateStr = b.date.toISOString().split("T")[0]
    return aDateStr.localeCompare(bDateStr)
  })

  // Sort past events by date (descending - most recent first)
  pastEvents.sort((a, b) => {
    const aDateStr = a.date.toISOString().split("T")[0]
    const bDateStr = b.date.toISOString().split("T")[0]
    return bDateStr.localeCompare(aDateStr)
  })

  // If we have upcoming events, prioritize them
  if (upcomingEvents.length > 0) {
    const eventsToShow = limit && limit > 0 ? upcomingEvents.slice(0, limit) : upcomingEvents
    return eventsToShow
  }

  // Otherwise, show most recent past events
  const eventsToShow = limit && limit > 0 ? pastEvents.slice(0, limit) : pastEvents
  return eventsToShow
}

export function getEventsByDate(): { upcomingEvents: Event[]; pastEvents: Event[] } {
  const allEvents = getAllEventsServer()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0]

  const upcomingEvents = allEvents.filter((event) => {
    const eventDateStr = event.date.toISOString().split("T")[0]
    return eventDateStr >= today
  })
  const pastEvents = allEvents.filter((event) => {
    const eventDateStr = event.date.toISOString().split("T")[0]
    return eventDateStr < today
  })

  // Sort upcoming events by date (ascending)
  upcomingEvents.sort((a, b) => {
    const aDateStr = a.date.toISOString().split("T")[0]
    const bDateStr = b.date.toISOString().split("T")[0]
    return aDateStr.localeCompare(bDateStr)
  })

  // Sort past events by date (descending)
  pastEvents.sort((a, b) => {
    const aDateStr = a.date.toISOString().split("T")[0]
    const bDateStr = b.date.toISOString().split("T")[0]
    return bDateStr.localeCompare(aDateStr)
  })

  return {
    upcomingEvents,
    pastEvents,
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

    return parseEventFile(fileName)
  } catch (error) {
    console.error(`Error getting event by slug ${slug}:`, error)
    return null
  }
}
