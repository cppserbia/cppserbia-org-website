import { NextResponse } from "next/server"
import { logger, extractErrorDetails } from "@/lib/logger"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const requestId = `api-config-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  logger.info(`[${requestId}] Received request: ${request.method} ${requestUrl.pathname}`)

  try {
    // This is a simple API route to check if the Meetup API key is configured
    const apiKey = process.env.MEETUP_API_KEY
    const isConfigured = !!apiKey

    const message = apiKey
      ? "Meetup API key is configured"
      : "Meetup API key is not configured. Please add MEETUP_API_KEY to your environment variables."

    logger.info(`[${requestId}] Meetup API configuration check`, {
      configured: isConfigured,
      keyExists: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
    })

    return NextResponse.json({
      configured: isConfigured,
      message: message,
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    const errorDetails = extractErrorDetails(error)

    logger.error(`[${requestId}] Error checking Meetup API configuration`, errorDetails)

    return NextResponse.json(
      {
        error: "Failed to check Meetup API configuration",
        details: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorIsObject: typeof error === "object",
        errorIsNull: error === null,
        errorKeys: typeof error === "object" && error !== null ? Object.keys(error) : [],
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 },
    )
  }
}
