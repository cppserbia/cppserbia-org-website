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
  time: string
  location: string
  description: string
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
    const fileDate = dateMatch ? dateMatch[1] : frontmatter.date

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

    return {
      slug,
      title: frontmatter.title,
      date: fileDate,
      time: frontmatter.time || "TBD",
      location: frontmatter.location || "TBD",
      description: frontmatter.description || "",
      registrationLink: frontmatter.registrationLink,
      formattedDate,
      day,
      month,
      year,
      isOnline: frontmatter.isOnline || false,
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
