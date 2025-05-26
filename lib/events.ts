import fs from "fs"
import path from "path"
import matter from "gray-matter"

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

// Interface for event data
export interface Event {
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
  content?: string
}

// Interface for markdown event frontmatter
interface EventFrontmatter {
  title: string
  date?: string
  time: string
  location: string
  description: string
  registrationLink?: string
  imageUrl?: string
  isOnline?: boolean
}

// Function to get all markdown event files
export function getEventFiles(): string[] {
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
export function parseEventFile(fileName: string): Event | null {
  try {
    const filePath = path.join(eventsDirectory, fileName)
    const fileContents = fs.readFileSync(filePath, "utf8")

    // Parse frontmatter and content
    const { data, content } = matter(fileContents)
    const frontmatter = data as EventFrontmatter

    // Parse the date from the filename (yyyy-mm-dd-name-of-event.md)
    const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/)
    const fileDate = dateMatch ? dateMatch[1] : frontmatter.date || new Date().toISOString().split("T")[0]

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
      content, // Include the full markdown content
    }
  } catch (error) {
    console.error(`Error parsing event file ${fileName}:`, error)
    return null
  }
}

// Function to get all events
export function getAllEvents(): Event[] {
  const fileNames = getEventFiles()
  const allEvents = fileNames
    .map((fileName) => parseEventFile(fileName))
    .filter((event): event is Event => event !== null)

  // Sort events by date (newest first)
  return allEvents.sort((a, b) => {
    if (a.date < b.date) return 1
    if (a.date > b.date) return -1
    return 0
  })
}

// Function to get a specific event by slug
export function getEventBySlug(slug: string): Event | null {
  try {
    const fileName = `${slug}.md`
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

// Function to separate events into upcoming and past
export function getEventsByDate(): { upcomingEvents: Event[]; pastEvents: Event[] } {
  const allEvents = getAllEvents()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0]

  const upcomingEvents = allEvents.filter((event) => event.date >= today)
  const pastEvents = allEvents.filter((event) => event.date < today)

  // Sort upcoming events by date (ascending)
  upcomingEvents.sort((a, b) => a.date.localeCompare(b.date))

  // Sort past events by date (descending)
  pastEvents.sort((a, b) => b.date.localeCompare(a.date))

  return {
    upcomingEvents,
    pastEvents,
  }
}
