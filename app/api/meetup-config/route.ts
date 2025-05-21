import { NextResponse } from "next/server"

export async function GET() {
  // This is a simple API route to check if the Meetup API key is configured
  const apiKey = process.env.MEETUP_API_KEY

  return NextResponse.json({
    configured: !!apiKey,
    message: apiKey
      ? "Meetup API key is configured"
      : "Meetup API key is not configured. Please add MEETUP_API_KEY to your environment variables.",
  })
}
