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
      const response = await fetch("/api/meetup-config")

      if (!response.ok) {
        throw new Error("Failed to check API configuration")
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError("Failed to check API configuration status")
      console.error(err)
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
