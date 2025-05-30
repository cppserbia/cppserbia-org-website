// Client-side types and interfaces for events
// For server-side event operations, use events-server.ts
export interface Event {
  slug: string
  title: string
  date: string // Keep as string for client-side compatibility
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
