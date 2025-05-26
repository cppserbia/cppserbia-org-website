"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, RefreshCw, Terminal } from "lucide-react"

export default function MeetupApiDiagnostics() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("[Client] Running Meetup API diagnostics...")
      const startTime = performance.now()

      const response = await fetch("/api/meetup-test")

      const endTime = performance.now()
      console.log(
        `[Client] Diagnostics response received in ${Math.round(endTime - startTime)}ms with status: ${response.status} ${response.statusText}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Client] Diagnostics error response:`, errorText)
        throw new Error(`Failed to run diagnostics: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[Client] Diagnostics result:", data)

      setResult(data)
      setRequestId(data.requestId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[Client] Error running diagnostics:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-purple-900 bg-[#0c0c1d]/80">
      <CardHeader>
        <CardTitle className="text-purple-300 flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Meetup API Diagnostics
        </CardTitle>
        <CardDescription className="text-gray-400">Test the connection to the Meetup GraphQL API</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 border border-red-500/30 rounded-lg bg-red-950/20 text-red-300">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Error running diagnostics</span>
            </div>
            <p>{error}</p>
            {requestId && <p className="text-xs mt-2 text-gray-400">Request ID: {requestId}</p>}
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div
              className={`p-4 border rounded-lg ${result.success ? "border-green-500/30 bg-green-950/20 text-green-300" : "border-red-500/30 bg-red-950/20 text-red-300"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="font-semibold">
                  {result.success ? "API Connection Successful" : "API Connection Failed"}
                </span>
              </div>
              <p>
                Status: {result.status} {result.statusText}
              </p>
              <p>Response Time: {result.duration}</p>
              {requestId && <p className="text-xs mt-2 text-gray-400">Request ID: {requestId}</p>}
            </div>

            {result.data && (
              <div className="p-4 border border-purple-900 rounded-lg bg-purple-950/10 text-gray-300">
                <h4 className="font-semibold mb-2">Response Data</h4>
                <div className="bg-[#0c0c1d] p-3 rounded text-xs font-mono overflow-auto max-h-60">
                  <pre>{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              </div>
            )}

            {result.data?.errors && (
              <div className="p-4 border border-red-500/30 rounded-lg bg-red-950/20 text-red-300">
                <h4 className="font-semibold mb-2">GraphQL Errors</h4>
                <div className="bg-[#0c0c1d] p-3 rounded text-xs font-mono overflow-auto max-h-60">
                  <pre>{JSON.stringify(result.data.errors, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Click the button below to test the Meetup API connection</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={runDiagnostics}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <Terminal className="h-4 w-4 mr-2" />
              Run API Diagnostics
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
