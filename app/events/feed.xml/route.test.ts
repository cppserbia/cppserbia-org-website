import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/events-server', () => ({
    getAllEventsServer: vi.fn(() => [
        {
            slug: 'test-event',
            title: 'Test Event',
            description: 'Test Description',
            date: { year: 2023, month: 1, day: 1, toString: () => '2023-01-01' },
            startDateTime: { toString: () => '2023-01-01T10:00:00' },
        },
    ]),
}))

describe('Events RSS Feed', () => {
    it('generates valid RSS XML', async () => {
        const response = await GET()
        const text = await response.text()

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('xml')
        expect(text).toContain('<rss version="2.0"')
        expect(text).toContain('<title>C++ Serbia Community Events</title>')
        expect(text).toContain('<title>Test Event</title>')
    })
})
