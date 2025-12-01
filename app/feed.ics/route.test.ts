import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/events-server', () => ({
    getAllEventsServer: vi.fn(() => [
        {
            slug: 'test-event',
            title: 'Test Event',
            description: 'Test Description',
            location: 'Test Location',
            startDateTime: {
                year: 2023, month: 1, day: 1, hour: 10, minute: 0,
                add: () => ({ year: 2023, month: 1, day: 1, hour: 12, minute: 0 })
            },
        },
    ]),
}))

describe('ICS Feed', () => {
    it('generates valid ICS file', async () => {
        const response = await GET()
        const text = await response.text()

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('text/calendar')
        expect(text).toContain('BEGIN:VCALENDAR')
        expect(text).toContain('BEGIN:VEVENT')
        expect(text).toContain('SUMMARY:Test Event')
        expect(text).toContain('DESCRIPTION:Test Description')
        expect(text).toContain('LOCATION:Test Location')
    })
})
