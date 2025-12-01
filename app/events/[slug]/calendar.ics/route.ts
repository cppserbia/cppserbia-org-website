import { createEvents, DateArray, EventAttributes } from 'ics';
import { getEventBySlug } from '@/lib/events-server';
import { NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const event = getEventBySlug(slug);

    if (!event) {
        return new Response('Event not found', { status: 404 });
    }

    const siteUrl = 'https://cppserbia.org';

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
                // Default to 2 hours if no end time
                const endDate = event.startDateTime.add({ hours: 2 });
                end = [endDate.year, endDate.month, endDate.day, endDate.hour, endDate.minute];
            }
        } else {
            const { year, month, day } = event.date;
            start = [year, month, day];
            end = [year, month, day]; // All day event
        }
    } catch (error) {
        console.warn(`Error creating date for event ${event.slug}:`, error);
        const now = new Date();
        start = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()];
        end = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours() + 1, now.getMinutes()];
    }

    const icsEvent: EventAttributes = {
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

    const { error, value } = createEvents([icsEvent]);

    if (error) {
        console.error('Error generating ICS file:', error);
        return new Response('Error generating ICS file', { status: 500 });
    }

    return new Response(value, {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
            'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
    });
}
