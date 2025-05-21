import fs from "fs"
import path from "path"
import matter from "gray-matter"

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
}

const eventsDirectory = path.join(process.cwd(), "content/events")

export function getAllEvents() {
  // Ensure the directory exists
  if (!fs.existsSync(eventsDirectory)) {
    return { upcomingEvents: [], pastEvents: [] }
  }

  // Get all event files
  const fileNames = fs.readdirSync(eventsDirectory)
  const allEvents = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      // Remove ".md" from file name to get slug
      const slug = fileName.replace(/\.md$/, "")

      // Read markdown file as string
      const fullPath = path.join(eventsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, "utf8")

      // Use gray-matter to parse the event metadata section
      const matterResult = matter(fileContents)

      // Parse the date from the filename (yyyy-mm-dd-slug.md)
      const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/)
      const dateStr = dateMatch ? dateMatch[1] : ""

      // Format the date for display
      const date = dateStr ? new Date(dateStr) : new Date()
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      const day = date.getDate().toString()
      const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase()
      const year = date.getFullYear().toString()

      // Combine the data with the slug
      return {
        slug,
        date: dateStr,
        formattedDate,
        day,
        month,
        year,
        ...matterResult.data,
        content: matterResult.content,
      } as Event
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const now = new Date()

  // Separate upcoming and past events
  const upcomingEvents = allEvents.filter((event) => new Date(event.date) >= now)
  const pastEvents = allEvents.filter((event) => new Date(event.date) < now).reverse() // Most recent past events first

  return {
    upcomingEvents,
    pastEvents,
  }
}

export function getUpcomingEvents(limit?: number) {
  const { upcomingEvents } = getAllEvents()
  return limit ? upcomingEvents.slice(0, limit) : upcomingEvents
}
