import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/events-server', () => ({
    getEventBySlug: vi.fn((slug) => {
        if (slug === 'test-event') {
            return {
                slug: 'test-event',
                title: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                startDateTime: {
                    year: 2023, month: 1, day: 1, hour: 10, minute: 0,
                    add: () => ({ year: 2023, month: 1, day: 1, hour: 12, minute: 0 })
                },
            }
        }
        return null
    }),
}))

describe('Single Event ICS Feed', () => {
    it('generates valid ICS for existing event', async () => {
        const request = new NextRequest('https://cppserbia.org/events/test-event/calendar.ics')
        const params = Promise.resolve({ slug: 'test-event' })

        const response = await GET(request, { params })
        const text = await response.text()

        expect(response.status).toBe(200)
        expect(text).toContain('BEGIN:VCALENDAR')
        expect(text).toContain('SUMMARY:Test Event')
    })

    it('returns 404 for non-existent event', async () => {
        const request = new NextRequest('https://cppserbia.org/events/non-existent/calendar.ics')
        const params = Promise.resolve({ slug: 'non-existent' })

        const response = await GET(request, { params })

        expect(response.status).toBe(404)
    })
})
