import fs from "fs"
import path from "path"
import matter from "gray-matter"
import type { FormattedEvent } from "./meetup-api"

// Define the path to the events folder
const eventsDirectory = path.join(process.cwd(), "events")

// Ensure the events directory exists
try {
  if (!fs.existsSync(eventsDirectory)) {
    fs.mkdirSync(eventsDirectory, { recursive: true })
  }
} catch (error) {
  console.error("Error creating events directory:", error)
}

// Interface for markdown event frontmatter
interface EventFrontmatter {
  title: string
  date: string
  created?: string
  event_type?: string
  status?: string
  duration?: string
  end_time?: string
  event_url?: string
  event_id?: string | number
  venues?: string[]
  time?: string
  location?: string
  description?: string
  registrationLink?: string
  imageUrl?: string
  isOnline?: boolean
}

// Function to get all markdown event files
export function getMarkdownEventFiles(): string[] {
  try {
    // Check if directory exists
    if (!fs.existsSync(eventsDirectory)) {
      console.warn("Events directory does not exist:", eventsDirectory)
      return []
    }

    // Get all markdown files
    const fileNames = fs.readdirSync(eventsDirectory)
    return fileNames.filter((fileName) => fileName.endsWith(".md"))
  } catch (error) {
    console.error("Error reading event files:", error)
    return []
  }
}

// Function to parse a markdown event file
export function parseMarkdownEvent(fileName: string): FormattedEvent | null {
  try {
    const filePath = path.join(eventsDirectory, fileName)
    const fileContents = fs.readFileSync(filePath, "utf8")

    // Parse frontmatter and content
    const { data, content } = matter(fileContents)
    const frontmatter = data as EventFrontmatter

    // Parse the date from the filename (yyyy-mm-dd-name-of-event.md)
    const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/)
    let fileDate = dateMatch ? dateMatch[1] : ""

    // If no date from filename, try to extract from frontmatter.date
    if (!fileDate && frontmatter.date) {
      // If date is in ISO format (2024-10-02T18:00:00+02:00), extract just the date part
      if (frontmatter.date.includes("T")) {
        fileDate = frontmatter.date.split("T")[0]
      } else {
        fileDate = frontmatter.date
      }
    }

    // Fallback to current date if no date found
    if (!fileDate) {
      fileDate = new Date().toISOString().split("T")[0]
    }

    // Create a date object for formatting
    const eventDate = new Date(fileDate)

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

    // Create a slug from the filename without the extension
    const slug = fileName.replace(/\.md$/, "")

    // Extract time from frontmatter.date if it's in ISO format, or use time field
    let time = "TBD"
    if (frontmatter.date && frontmatter.date.includes("T")) {
      try {
        const eventDateTime = new Date(frontmatter.date)
        const endDateTime = frontmatter.end_time ? new Date(frontmatter.end_time) : null

        const timeFormat: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true }
        const startTime = eventDateTime.toLocaleTimeString("en-US", timeFormat)

        if (endDateTime) {
          const endTime = endDateTime.toLocaleTimeString("en-US", timeFormat)
          time = `${startTime} - ${endTime}`
        } else {
          time = startTime
        }
      } catch (error) {
        console.warn(`Error parsing time from date ${frontmatter.date}:`, error)
        time = frontmatter.time || "TBD"
      }
    } else {
      time = frontmatter.time || "TBD"
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

    return {
      slug,
      title: frontmatter.title,
      date: fileDate,
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
      source: "markdown",
      content, // Include the full markdown content
    }
  } catch (error) {
    console.error(`Error parsing markdown event ${fileName}:`, error)
    return null
  }
}

// Function to get all markdown events
export function getAllMarkdownEvents(): FormattedEvent[] {
  const fileNames = getMarkdownEventFiles()
  const allEvents = fileNames
    .map((fileName) => parseMarkdownEvent(fileName))
    .filter((event): event is FormattedEvent => event !== null)

  // Sort events by date (newest first)
  return allEvents.sort((a, b) => {
    if (a.date < b.date) return 1
    if (a.date > b.date) return -1
    return 0
  })
}

// Function to get a specific markdown event by slug
export function getMarkdownEventBySlug(slug: string): FormattedEvent | null {
  try {
    const fileName = `${slug}.md`
    const filePath = path.join(eventsDirectory, fileName)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Event file not found: ${filePath}`)
      return null
    }

    return parseMarkdownEvent(fileName)
  } catch (error) {
    console.error(`Error getting event by slug ${slug}:`, error)
    return null
  }
}

// Function to separate events into upcoming and past
export function getMarkdownEventsByDate(): { upcomingEvents: FormattedEvent[]; pastEvents: FormattedEvent[] } {
  const allEvents = getAllMarkdownEvents()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0]

  const upcomingEvents = allEvents.filter((event) => event.date >= today)
  const pastEvents = allEvents.filter((event) => event.date < today)

  return {
    upcomingEvents,
    pastEvents,
  }
}
