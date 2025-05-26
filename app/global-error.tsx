"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error with detailed information
    console.error("Global error caught:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      // Try to extract additional properties
      ...Object.fromEntries(
        Object.entries(error).filter(([key]) => !["name", "message", "stack", "digest"].includes(key)),
      ),
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
          <div className="flex items-center justify-center min-h-[100vh]">
            <div className="flex flex-col items-center text-center max-w-md p-8 border border-red-500/30 rounded-lg bg-red-950/10">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong!</h2>
              <p className="text-gray-300 mb-6">We encountered an unexpected error. Our team has been notified.</p>
              <div className="p-4 bg-red-950/30 rounded mb-6 text-left w-full">
                <p className="text-red-300 font-mono text-sm break-words">{error.message || "Unknown error"}</p>
                {error.digest && <p className="text-red-300 font-mono text-xs mt-2">Error ID: {error.digest}</p>}
              </div>
              <Button
                onClick={reset}
                className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white"
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
