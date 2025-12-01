import { createEvents, DateArray, EventAttributes } from 'ics';
import { getAllEventsServer } from '@/lib/events-server';

export async function GET() {
    const allEvents = getAllEventsServer();
    const siteUrl = 'https://cppserbia.org';

    const events: EventAttributes[] = allEvents.map((event) => {
        let start: DateArray;
        let end: DateArray;

        try {
            if (event.startDateTime) {
                const { year, month, day, hour, minute } = event.startDateTime;
                start = [year, month, day, hour, minute];

                if (event.endDateTime) {
                    const { year, month, day, hour, minute } = event.endDateTime;
                    end = [year, month, day, hour, minute];
                } else {
                    // Default to 2 hours if no end time, or just use start time + duration if I could
                    // But for now let's just add 2 hours to start
                    const endDate = event.startDateTime.add({ hours: 2 });
                    end = [endDate.year, endDate.month, endDate.day, endDate.hour, endDate.minute];
                }

            } else {
                const { year, month, day } = event.date;
                start = [year, month, day];
                end = [year, month, day]; // All day event if no time?
            }
        } catch (error) {
            console.warn(`Error creating date for event ${event.slug}:`, error);
            const now = new Date();
            start = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()];
            end = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours() + 1, now.getMinutes()];
        }

        return {
            start,
            end,
            title: event.title,
            description: event.description,
            location: event.location,
            url: `${siteUrl}/events/${event.slug}`,
            uid: `${siteUrl}/events/${event.slug}`,
            categories: ['C++'],
            organizer: { name: 'C++ Serbia', email: 'info@cppserbia.org' },
        };
    });

    const { error, value } = createEvents(events);

    if (error) {
        console.error('Error generating ICS feed:', error);
        return new Response('Error generating ICS feed', { status: 500 });
    }

    return new Response(value, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'inline; filename="events.ics"',
            'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
    });
}
