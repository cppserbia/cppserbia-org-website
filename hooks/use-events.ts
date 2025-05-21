"use client"

import { useState, useEffect } from "react"
import type { FormattedEvent } from "@/lib/meetup-api"

interface UseEventsOptions {
  limit?: number
  upcomingOnly?: boolean
}

interface UseEventsResult {
  upcomingEvents: FormattedEvent[]
  pastEvents: FormattedEvent[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useEvents({ limit, upcomingOnly = false }: UseEventsOptions = {}): UseEventsResult {
  const [upcomingEvents, setUpcomingEvents] = useState<FormattedEvent[]>([])
  const [pastEvents, setPastEvents] = useState<FormattedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEvents = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let url = "/api/events"
      const params = new URLSearchParams()

      if (upcomingOnly) {
        params.append("upcomingOnly", "true")
      }

      if (limit) {
        params.append("limit", limit.toString())
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`)
      }

      const data = await response.json()

      if (upcomingOnly) {
        setUpcomingEvents(data.events || [])
        setPastEvents([])
      } else {
        setUpcomingEvents(data.upcomingEvents || [])
        setPastEvents(data.pastEvents || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      console.error("Error fetching events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [limit, upcomingOnly])

  return {
    upcomingEvents,
    pastEvents,
    isLoading,
    error,
    refetch: fetchEvents,
  }
}
