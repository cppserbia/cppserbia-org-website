import { NextRequest, NextResponse } from 'next/server'
import { getFeaturedEventsServer } from '@/lib/events-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    console.log(`[API] Getting featured events with limit: ${limit || 'unlimited'}`)

    const startTime = performance.now()
    const featuredEvents = getFeaturedEventsServer(limit)
    const endTime = performance.now()

    console.log(`[API] Retrieved ${featuredEvents.length} featured events in ${Math.round(endTime - startTime)}ms`)

    return NextResponse.json({
      events: featuredEvents,
      count: featuredEvents.length
    })
  } catch (error) {
    console.error('[API] Error getting featured events:', error)
    return NextResponse.json(
      { error: 'Failed to load featured events' },
      { status: 500 }
    )
  }
}
