import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Helper function to safely stringify objects for logging
function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return `[Error stringifying object: ${e instanceof Error ? e.message : String(e)}]`
  }
}

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname
  const requestId = `mw-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Create a detailed log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId,
    method: request.method,
    url: `${pathname}${request.nextUrl.search}`,
    headers: Object.fromEntries(
      Array.from(request.headers.entries()).filter(([key]) => !["cookie", "authorization"].includes(key.toLowerCase())),
    ),
    ip: request.ip || "unknown",
    geo: request.geo || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    referrer: request.headers.get("referer") || "unknown",
    contentType: request.headers.get("content-type") || "unknown",
    accept: request.headers.get("accept") || "unknown",
  }

  // Log the request
  console.log(`[${logEntry.timestamp}] [MIDDLEWARE] Request: ${request.method} ${pathname}${request.nextUrl.search}`)
  console.log(`[${logEntry.timestamp}] [MIDDLEWARE] Request details:`, safeStringify(logEntry))

  // Continue with the request
  const response = NextResponse.next()

  // Add request ID to response headers for tracking
  response.headers.set("x-request-id", requestId)

  return response
}

// Run the middleware on all routes
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
}
