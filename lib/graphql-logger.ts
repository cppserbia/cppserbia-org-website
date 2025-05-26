/**
 * GraphQL request/response logger for Meetup API
 */

// Helper to safely stringify objects, handling circular references
export function safeStringify(obj: any, indent = 2): string {
  const cache = new Set()
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          return "[Circular Reference]"
        }
        cache.add(value)
      }
      return value
    },
    indent,
  )
}

// Format GraphQL query for better readability in logs
export function formatGraphQLQuery(query: string): string {
  // Basic formatting - remove extra whitespace
  return query
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, " { ")
    .replace(/\s*}\s*/g, " } ")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .trim()
}

// Log a GraphQL request
export function logGraphQLRequest(
  requestId: string,
  url: string,
  query: string,
  variables: Record<string, any>,
  headers: Record<string, string>,
): void {
  console.log(`[${new Date().toISOString()}] [${requestId}] GraphQL Request to ${url}:`)
  console.log(`[${new Date().toISOString()}] [${requestId}] Headers:`, safeStringify(headers))
  console.log(`[${new Date().toISOString()}] [${requestId}] Query:`, formatGraphQLQuery(query))
  console.log(`[${new Date().toISOString()}] [${requestId}] Variables:`, safeStringify(variables))
}

// Log a GraphQL response
export function logGraphQLResponse(
  requestId: string,
  url: string,
  status: number,
  statusText: string,
  headers: Record<string, string>,
  body: any,
  duration: number,
): void {
  console.log(
    `[${new Date().toISOString()}] [${requestId}] GraphQL Response from ${url} (${duration}ms) - Status: ${status} ${statusText}`,
  )
  console.log(`[${new Date().toISOString()}] [${requestId}] Response Headers:`, safeStringify(headers))

  // Check if the response has GraphQL errors
  if (body && body.errors) {
    console.error(`[${new Date().toISOString()}] [${requestId}] GraphQL Errors:`, safeStringify(body.errors))
  }

  // Log data structure if available
  if (body && body.data) {
    console.log(
      `[${new Date().toISOString()}] [${requestId}] Data Structure:`,
      safeStringify(
        Object.keys(body.data).reduce((acc, key) => {
          // For each top-level field, show structure without all the data
          acc[key] =
            typeof body.data[key] === "object"
              ? `[${typeof body.data[key]}:${Array.isArray(body.data[key]) ? "Array" : "Object"}]`
              : body.data[key]
          return acc
        }, {}),
      ),
    )
  }

  // Log full response for debugging
  console.log(`[${new Date().toISOString()}] [${requestId}] Full Response Body:`, safeStringify(body))
}

// Log a GraphQL error
export function logGraphQLError(
  requestId: string,
  url: string,
  error: any,
  query?: string,
  variables?: Record<string, any>,
): void {
  console.error(`[${new Date().toISOString()}] [${requestId}] GraphQL Error for request to ${url}:`)

  if (query) {
    console.error(`[${new Date().toISOString()}] [${requestId}] Query:`, formatGraphQLQuery(query))
  }

  if (variables) {
    console.error(`[${new Date().toISOString()}] [${requestId}] Variables:`, safeStringify(variables))
  }

  // Extract error details
  const errorDetails =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error as any), // Include any custom properties
        }
      : error

  console.error(`[${new Date().toISOString()}] [${requestId}] Error Details:`, safeStringify(errorDetails))
}
