"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export default function MeetupApiStatus() {
  const [status, setStatus] = useState<{
    configured: boolean
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkApiStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[Client] Checking Meetup API configuration status...")
      const startTime = performance.now()

      const response = await fetch("/api/meetup-config")

      const endTime = performance.now()
      console.log(
        `[Client] API status response received in ${Math.round(endTime - startTime)}ms with status: ${response.status} ${response.statusText}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Client] API status error response: ${errorText}`)
        throw new Error(`Failed to check API configuration: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[Client] API configuration status:", data)
      setStatus(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[Client] Error checking API configuration:", errorMessage)
      setError(`Failed to check API configuration status: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkApiStatus()
  }, [])

  return (
    <div className="p-4 border rounded-lg bg-[#0c0c1d]/80 border-purple-900">
      <h3 className="text-lg font-medium mb-2 text-purple-300">Meetup API Status</h3>

      {loading ? (
        <div className="flex items-center text-gray-400">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Checking API configuration...
        </div>
      ) : error ? (
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      ) : status ? (
        <div className="flex items-center text-gray-300">
          {status.configured ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
          )}
          {status.message}
        </div>
      ) : null}

      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={checkApiStatus}
          disabled={loading}
          className="text-purple-300 border-purple-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>
    </div>
  )
}
