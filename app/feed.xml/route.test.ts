import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'

// Mock the events server
vi.mock('@/lib/events-server', () => ({
    getAllEventsServer: vi.fn(() => [
        {
            slug: 'test-event',
            title: 'Test Event',
            description: 'Test Description',
            content: 'Test Content',
            date: { year: 2023, month: 1, day: 1 },
            startDateTime: { year: 2023, month: 1, day: 1, hour: 10, minute: 0, second: 0 },
            imageUrl: '/images/test.png',
        },
    ]),
}))

describe('RSS Feed', () => {
    it('generates valid RSS XML', async () => {
        const response = await GET()
        const text = await response.text()

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('xml')
        expect(text).toContain('<rss version="2.0"')
        expect(text).toContain('<title>C++ Serbia Events</title>')
        expect(text).toContain('Test Event')
        expect(text).toContain('<link>https://cppserbia.org/events/test-event</link>')
    })
})
