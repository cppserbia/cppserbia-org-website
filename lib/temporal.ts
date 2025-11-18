// Temporal API utilities and polyfill setup
import { Temporal } from '@js-temporal/polyfill'
/**
 * Convert a Date object to Temporal.PlainDate
 */
export function dateToPlainDate(date: Date): Temporal.PlainDate {
  return Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1, // Temporal months are 1-based
    day: date.getDate()
  })
}

/**
 * Convert a Date object to Temporal.ZonedDateTime
 * Note: Interprets the date/time components as being in the target timezone
 * (not UTC, despite how gray-matter may have parsed it)
 */
export function dateToZonedDateTime(date: Date, timeZone: string = 'Europe/Belgrade'): Temporal.ZonedDateTime {
  // Extract the date/time components and interpret them as being in the target timezone
  // This handles the case where gray-matter parses "2025-11-19T18:00:00" as UTC,
  // but we want to treat those components as Belgrade time
  return Temporal.ZonedDateTime.from({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
    timeZone
  })
}

/**
 * Get today's date as Temporal.PlainDate
 */
export function today(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO()
}

/**
 * Get current time as Temporal.ZonedDateTime in Belgrade timezone
 */
export function now(timeZone: string = 'Europe/Belgrade'): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO(timeZone)
}

/**
 * Convert string to Temporal.PlainDate
 */
export function stringToPlainDate(dateString: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateString)
}

/**
 * Convert ISO string to Temporal.ZonedDateTime
 */
export function stringToZonedDateTime(isoString: string, timeZone: string = 'Europe/Belgrade'): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.from(isoString).withTimeZone(timeZone)
}

/**
 * Get current year for copyright
 */
export function getCurrentYear(): number {
  return Temporal.Now.plainDateISO().year
}

/**
 * Check if an event date is in the past
 */
export function isPastEvent(eventDate: Temporal.PlainDate): boolean {
  const todayPlain = today()

  return Temporal.PlainDate.compare(eventDate, todayPlain) < 0
}

/**
 * Format a date for display using Temporal
 */
export function formatEventDate(date: Temporal.PlainDate): {
  formattedDate: string
  day: string
  month: string
  year: string
} {
  const formattedDate = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const day = date.day.toString()
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = date.year.toString()

  return { formattedDate, day, month, year }
}

/**
 * Format time for display using Temporal
 */
export function formatEventTime(
  startDateTime: Temporal.ZonedDateTime,
  endDateTime?: Temporal.ZonedDateTime
): string {
  const timeFormat = { hour: '2-digit', minute: '2-digit', hour12: false } as const
  const startTime = startDateTime.toLocaleString('en-US', timeFormat)

  if (endDateTime) {
    const endTime = endDateTime.toLocaleString('en-US', timeFormat)
    return `${startTime}-${endTime}`
  }

  return startTime
}

/**
 * Sort events by date using Temporal
 */
export function sortEventsByDate<T extends { date: Temporal.PlainDate }>(
  events: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return events.sort((a, b) => {
    const comparison = Temporal.PlainDate.compare(a.date, b.date)
    return order === 'asc' ? comparison : -comparison
  })
}
