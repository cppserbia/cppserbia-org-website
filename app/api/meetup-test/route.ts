import { NextResponse } from "next/server"
import { logGraphQLRequest, logGraphQLResponse, logGraphQLError } from "@/lib/graphql-logger"

// Simple query to test the API connection
const TEST_QUERY = `
query TestQuery {
  group(id: 21118957) {
    name
    urlname
  }
}
`

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const requestId = `api-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  console.log(`[${new Date().toISOString()}] [${requestId}] Testing Meetup API connection`)

  try {
    // Get API key from environment variable
    const apiKey = process.env.MEETUP_API_KEY

    if (!apiKey) {
      console.warn(`[${new Date().toISOString()}] [${requestId}] MEETUP_API_KEY not found in environment variables`)
      return NextResponse.json(
        {
          error: "API key not configured",
          message: "Meetup API key is not configured. Please add MEETUP_API_KEY to your environment variables.",
        },
        { status: 400 },
      )
    }

    const apiUrl = "https://api.meetup.com/gql-ext"
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "CPP-Serbia-Community-Website/1.0",
      Accept: "application/json",
    }

    const requestBody = {
      query: TEST_QUERY,
      variables: {},
    }

    // Log the test request
    logGraphQLRequest(
      requestId,
      apiUrl,
      TEST_QUERY,
      {},
      {
        ...headers,
        Authorization: "Bearer [REDACTED]",
      },
    )

    const startTime = Date.now()

    // Make the request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // Get response as text
    const responseText = await response.text()

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { parseError: true, rawText: responseText.substring(0, 500) }
    }

    // Log the response
    logGraphQLResponse(
      requestId,
      apiUrl,
      response.status,
      response.statusText,
      Object.fromEntries(response.headers.entries()),
      responseData,
      duration,
    )

    // Return diagnostic information
    return NextResponse.json({
      success: response.ok && !responseData.errors,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      headers: Object.fromEntries(
        Array.from(response.headers.entries()).filter(([key]) => !["set-cookie"].includes(key.toLowerCase())),
      ),
      data: responseData,
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    // Log the error
    logGraphQLError(requestId, "https://api.meetup.com/gql-ext", error, TEST_QUERY, {})

    // Return error information
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 },
    )
  }
}
