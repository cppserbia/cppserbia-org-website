/**
 * Enhanced logger utility for consistent logging across the application
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
      // Handle Error objects specially
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
          ...(value as any), // Include any custom properties
        }
      }
      return value
    },
    indent,
  )
}

// Extract all properties from an error, including non-enumerable ones
export function extractErrorDetails(error: any): Record<string, any> {
  if (!error) {
    return { error: "Unknown error (null or undefined)" }
  }

  // If it's not an object, just return it as is
  if (typeof error !== "object") {
    return { error: String(error) }
  }

  // Start with an empty result object
  const result: Record<string, any> = {}

  // If it's an Error instance, get standard properties
  if (error instanceof Error) {
    result.name = error.name
    result.message = error.message
    result.stack = error.stack
  }

  // Get all enumerable properties
  for (const key in error) {
    try {
      const value = error[key]
      result[key] = value
    } catch (e) {
      result[key] = `[Error accessing property: ${e instanceof Error ? e.message : String(e)}]`
    }
  }

  // If we have an empty object, add a fallback message
  if (Object.keys(result).length === 0) {
    result.info = "Error was an empty object"
    result.originalError = String(error)
    result.errorType = typeof error
    result.errorConstructor = error.constructor ? error.constructor.name : "unknown"
    result.errorPrototype = Object.getPrototypeOf(error) ? Object.getPrototypeOf(error).constructor.name : "unknown"
  }

  return result
}

// Log levels
export type LogLevel = "debug" | "info" | "warn" | "error"

// Main logger function
export function log(level: LogLevel, message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  console[level](`${prefix} ${message}`)

  if (data !== undefined) {
    if (level === "error" && data instanceof Error) {
      const errorDetails = extractErrorDetails(data)
      console[level](`${prefix} Error details:`, safeStringify(errorDetails))
    } else {
      try {
        console[level](`${prefix} Additional data:`, safeStringify(data))
      } catch (e) {
        console[level](`${prefix} Error stringifying data:`, String(e))
        console[level](`${prefix} Original data type:`, typeof data)
      }
    }
  }
}

// Convenience methods
export const logger = {
  debug: (message: string, data?: any) => log("debug", message, data),
  info: (message: string, data?: any) => log("info", message, data),
  warn: (message: string, data?: any) => log("warn", message, data),
  error: (message: string, error?: any) => log("error", message, error),
}
