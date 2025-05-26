import { cache } from "react"
import { logger, extractErrorDetails } from "@/lib/logger"
import { logGraphQLRequest, logGraphQLResponse, logGraphQLError } from "@/lib/graphql-logger"
import { getMarkdownEventsByDate, getMarkdownEventBySlug } from "./markdown-events"

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
    name
    urlname
    link
    description
    events(status: $status, sort: DESC, first: 6) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      count
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

// Alternative query to try if the main one fails
const ALTERNATIVE_EVENTS_QUERY = `
query Events($status: EventStatus = PAST) {
  group(id: 21118957) {
    name
    urlname
    events(status: $status, sort: DESC, first: 6) {
      edges {
        node {
          id
          title
          dateTime
          endTime
          duration
          eventUrl
          status
          eventType
          description
          venues {
            name
            city
            address
          }
        }
      }
    }
  }
}
`

// Function to fetch events from Meetup.com GraphQL API
export const fetchMeetupEvents = cache(async (status: string): Promise<FormattedEvent[]> => {
  const apiUrl = "https://api.meetup.com/gql-ext"
  const requestId = `meetup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  logger.info(`[${requestId}] Starting to fetch ${status} events from Meetup API`)

  try {
    // Get API key from environment variable
    const apiKey = process.env.MEETUP_API_KEY

    if (!apiKey) {
      logger.warn(`[${requestId}] MEETUP_API_KEY not found in environment variables`)
      return []
    }

    // Prepare the request
    const query = EVENTS_QUERY
    const variables = { status }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "CPP-Serbia-Community-Website/1.0",
      Accept: "application/json",
    }

    const requestBody = {
      query,
      variables,
    }

    // Log the GraphQL request
    logGraphQLRequest(requestId, apiUrl, query, variables, {
      ...headers,
      Authorization: "Bearer [REDACTED]", // Don't log the actual token
    })

    const startTime = Date.now()

    // Wrap the fetch in a try/catch to catch network errors
    let response
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        next: { revalidate: 3600 }, // Revalidate every hour
      })
    } catch (fetchError) {
      logGraphQLError(requestId, apiUrl, fetchError, query, variables)
      logger.error(`[${requestId}] Network error during fetch`, extractErrorDetails(fetchError))
      return []
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    const status = response.status
    const statusText = response.statusText
    const responseHeaders = Object.fromEntries(response.headers.entries())

    logger.info(`[${requestId}] Response received in ${duration}ms with status: ${status} ${statusText}`, {
      status,
      statusText,
      headers: responseHeaders,
      duration,
    })

    // Try to get the response body as text first
    let responseBody
    try {
      responseBody = await response.text()
      logger.debug(`[${requestId}] Raw response body`, {
        body: responseBody.substring(0, 1000) + (responseBody.length > 1000 ? "..." : ""),
      })
    } catch (textError) {
      logGraphQLError(requestId, apiUrl, textError, query, variables)
      logger.error(`[${requestId}] Error getting response text`, extractErrorDetails(textError))
      return []
    }

    if (!response.ok) {
      logger.error(`[${requestId}] Failed to fetch events from Meetup.com`, {
        status: response.status,
        statusText: response.statusText,
        responseBody,
      })

      // Try alternative query if the main one fails
      return await tryAlternativeQuery(requestId, apiUrl, apiKey, status)
    }

    // Parse the JSON response
    let data
    try {
      data = JSON.parse(responseBody)

      // Log the GraphQL response
      logGraphQLResponse(requestId, apiUrl, response.status, response.statusText, responseHeaders, data, duration)
    } catch (jsonError) {
      logGraphQLError(requestId, apiUrl, jsonError, query, variables)
      logger.error(`[${requestId}] Error parsing JSON response`, {
        error: extractErrorDetails(jsonError),
        responseBody: responseBody.substring(0, 1000) + (responseBody.length > 1000 ? "..." : ""),
      })
      return []
    }

    // Check if we have valid data and handle potential errors
    if (data.errors) {
      logGraphQLError(requestId, apiUrl, data.errors, query, variables)
      logger.error(`[${requestId}] GraphQL errors in response`, {
        errors: data.errors,
        responseBody: responseBody.substring(0, 1000) + (responseBody.length > 1000 ? "..." : ""),
      })

      // Try alternative query if the main one has errors
      return await tryAlternativeQuery(requestId, apiUrl, apiKey, status)
    }

    // Check if we have the expected data structure
    if (!data?.data?.group?.events?.edges) {
      logger.error(`[${requestId}] Invalid response format from Meetup.com`, {
        responseStructure: Object.keys(data),
        dataKeys: data ? Object.keys(data) : "null",
        dataDataKeys: data?.data ? Object.keys(data.data) : "null",
        dataDataGroupKeys: data?.data?.group ? Object.keys(data.data.group) : "null",
        dataDataGroupEventsKeys: data?.data?.group?.events ? Object.keys(data.data.group.events) : "null",
        responseBody: responseBody.substring(0, 1000) + (responseBody.length > 1000 ? "..." : ""),
      })

      // Try alternative query if the main one has unexpected structure
      return await tryAlternativeQuery(requestId, apiUrl, apiKey, status)
    }

    // Extract events from the response
    const events: MeetupEvent[] = data.data.group.events.edges.map((edge: any) => edge.node)

    logger.info(`[${requestId}] Successfully fetched ${events.length} ${status} events from Meetup API`)

    // Format events to match our application's structure
    return events.map((event) => formatMeetupEvent(event))
  } catch (error) {
    logGraphQLError(requestId, apiUrl, error)
    logger.error(`[${requestId}] Unexpected error fetching events from Meetup.com`, extractErrorDetails(error))
    return []
  }
})

// Helper function to try an alternative query if the main one fails
async function tryAlternativeQuery(
  requestId: string,
  apiUrl: string,
  apiKey: string,
  status: string,
): Promise<FormattedEvent[]> {
  logger.info(`[${requestId}] Trying alternative query for ${status} events`)

  try {
    const query = ALTERNATIVE_EVENTS_QUERY
    const variables = { status }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "CPP-Serbia-Community-Website/1.0",
      Accept: "application/json",
    }

    const requestBody = {
      query,
      variables,
    }

    // Log the alternative GraphQL request
    logGraphQLRequest(`${requestId}-alt`, apiUrl, query, variables, {
      ...headers,
      Authorization: "Bearer [REDACTED]", // Don't log the actual token
    })

    const startTime = Date.now()

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    const responseText = await response.text()

    if (!response.ok) {
      logger.error(`[${requestId}-alt] Alternative query also failed`, {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText,
      })
      return []
    }

    const data = JSON.parse(responseText)

    // Log the alternative GraphQL response
    logGraphQLResponse(
      `${requestId}-alt`,
      apiUrl,
      response.status,
      response.statusText,
      Object.fromEntries(response.headers.entries()),
      data,
      duration,
    )

    if (data.errors || !data?.data?.group?.events?.edges) {
      logger.error(`[${requestId}-alt] Alternative query returned errors or invalid structure`, {
        errors: data.errors,
        structure: data?.data ? JSON.stringify(Object.keys(data.data)) : "null",
      })
      return []
    }

    const events: MeetupEvent[] = data.data.group.events.edges.map((edge: any) => edge.node)

    logger.info(`[${requestId}-alt] Successfully fetched ${events.length} ${status} events with alternative query`)

    return events.map((event) => formatMeetupEvent(event))
  } catch (error) {
    logger.error(`[${requestId}-alt] Error with alternative query`, extractErrorDetails(error))
    return []
  }
}

// Function to format Meetup events to match our application's structure
function formatMeetupEvent(event: MeetupEvent): FormattedEvent {
  try {
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
  } catch (error) {
    logger.error(`Error formatting Meetup event`, {
      error: extractErrorDetails(error),
      event: JSON.stringify(event),
    })

    // Return a fallback event with error information
    return {
      slug: `error-${Date.now()}`,
      title: "Error Processing Event",
      date: new Date().toISOString().split("T")[0],
      time: "Unknown time",
      location: "Unknown location",
      description: "There was an error processing this event. Please check the Meetup website for details.",
      formattedDate: new Date().toLocaleDateString(),
      day: new Date().getDate().toString(),
      month: new Date().toLocaleString("en-US", { month: "short" }).toUpperCase(),
      year: new Date().getFullYear().toString(),
      source: "api",
    }
  }
}

// Function to get all events (upcoming and past) from both sources
export async function getAllEvents() {
  const requestId = `all-events-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  logger.info(`[${requestId}] Fetching all events (upcoming and past)...`)

  try {
    // Get markdown events
    const { upcomingEvents: mdUpcomingEvents, pastEvents: mdPastEvents } = getMarkdownEventsByDate()
    logger.info(
      `[${requestId}] Fetched ${mdUpcomingEvents.length} upcoming and ${mdPastEvents.length} past markdown events`,
    )

    // Try to fetch API events
    let apiUpcomingEvents: FormattedEvent[] = []
    let apiPastEvents: FormattedEvent[] = []

    try {
      // Fetch events from API in parallel
      ;[apiUpcomingEvents, apiPastEvents] = await Promise.all([fetchMeetupEvents("ACTIVE"), fetchMeetupEvents("PAST")])

      logger.info(
        `[${requestId}] Successfully fetched ${apiUpcomingEvents.length} upcoming and ${apiPastEvents.length} past API events`,
      )
    } catch (error) {
      logger.error(
        `[${requestId}] Error fetching API events, falling back to markdown only`,
        extractErrorDetails(error),
      )
    }

    // Combine events from both sources
    const upcomingEvents = [...mdUpcomingEvents, ...apiUpcomingEvents]
    const pastEvents = [...mdPastEvents, ...apiPastEvents]

    // Sort events by date
    upcomingEvents.sort((a, b) => a.date.localeCompare(b.date))
    pastEvents.sort((a, b) => b.date.localeCompare(a.date)) // Past events in reverse order

    logger.info(
      `[${requestId}] Combined ${upcomingEvents.length} upcoming events and ${pastEvents.length} past events from all sources`,
    )

    return {
      upcomingEvents,
      pastEvents,
    }
  } catch (error) {
    logger.error(`[${requestId}] Error fetching events`, extractErrorDetails(error))

    // Fallback to markdown events only
    const { upcomingEvents, pastEvents } = getMarkdownEventsByDate()
    logger.info(
      `[${requestId}] Falling back to ${upcomingEvents.length} upcoming and ${pastEvents.length} past markdown events`,
    )

    return {
      upcomingEvents,
      pastEvents,
    }
  }
}

// Function to get a specific event by slug
export async function getEventBySlug(slug: string): Promise<FormattedEvent | null> {
  const requestId = `event-${slug}-${Date.now()}`
  logger.info(`[${requestId}] Fetching event with slug: ${slug}`)

  // First, try to get the event from markdown files
  const markdownEvent = getMarkdownEventBySlug(slug)
  if (markdownEvent) {
    logger.info(`[${requestId}] Found event in markdown files: ${markdownEvent.title}`)
    return markdownEvent
  }

  // If not found in markdown, it might be an API event
  // For API events, the slug format is: {id}-{title}
  const idMatch = slug.match(/^([^-]+)-/)
  if (!idMatch) {
    logger.warn(`[${requestId}] Invalid slug format for API event: ${slug}`)
    return null
  }

  // Try to find the event in both upcoming and past events
  try {
    const { upcomingEvents, pastEvents } = await getAllEvents()
    const allEvents = [...upcomingEvents, ...pastEvents]
    const event = allEvents.find((e) => e.slug === slug)

    if (event) {
      logger.info(`[${requestId}] Found event in API events: ${event.title}`)
      return event
    }

    logger.warn(`[${requestId}] Event not found with slug: ${slug}`)
    return null
  } catch (error) {
    logger.error(`[${requestId}] Error fetching event by slug`, extractErrorDetails(error))
    return null
  }
}
