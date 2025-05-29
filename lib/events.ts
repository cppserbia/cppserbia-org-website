// Client-side types and interfaces for events
// For server-side event operations, use events-server.ts

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
  featured?: boolean
  youtube?: string
}

// Client-side utility functions that don't require file system access
export function formatEventDate(dateString: string): { formattedDate: string; day: string; month: string; year: string } {
  const eventDate = new Date(dateString)

  const formattedDate = eventDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const day = eventDate.getDate().toString()
  const month = eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase()
  const year = eventDate.getFullYear().toString()

  return { formattedDate, day, month, year }
}

/**
 * Checks if an event is in the past
 * @param eventDate - The event date as a Date object or string
 * @returns true if the event is before today, false otherwise
 */
export function isPastEvent(eventDate: Date | string): boolean {
  const now = new Date();
  const dateObj = eventDate instanceof Date ? eventDate : new Date(eventDate);
  return dateObj < now;
}
