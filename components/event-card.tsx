import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
import { YouTubeIcon } from "@/components/icons";

interface Event {
    slug: string;
    title: string;
    date: Date | string;
    time: string;
    location: string;
    description: string;
    registrationLink?: string;
    formattedDate: string;
    day: string;
    month: string;
    year: string;
    youtube?: string;
}

interface EventCardProps {
    event: Event;
    isUpcoming: boolean;
    isPastEvent?: (date: Date | string) => boolean;
}

export function EventDateBadge({ day, month, year }: { day: string; month: string; year: string }) {
    return (
        <div className="md:w-1/4 flex-shrink-0">
            <div className="bg-purple-950 p-3 rounded-lg text-center">
                <div className="text-sm text-purple-300">{month}</div>
                <div className="text-3xl font-bold">{day}</div>
                <div className="text-sm text-purple-300">{year}</div>
            </div>
        </div>
    );
}

export function EventMetadata({
    formattedDate,
    time,
    location,
    className = "flex flex-col sm:flex-row sm:items-center gap-3 mb-4 text-sm text-gray-400"
}: {
    formattedDate: string;
    time: string;
    location: string;
    className?: string;
}) {
    return (
        <div className={className}>
            <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
                <span className="text-purple-400 mr-2">•</span>
                <Clock className="h-4 w-4 mr-2 text-purple-400" />
                <span>{time}</span>
            </div>
            <div className="flex items-center">
                <span className="text-purple-400 mr-2">•</span>
                <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                <span>{location}</span>
            </div>
        </div>
    );
}

export function EventMetadataPast({
    date,
    location
}: {
    date: Date | string;
    location: string;
}) {
    const formattedDateTime = new Date(date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });

    return (
        <div className="flex items-center text-sm text-gray-400 mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formattedDateTime} • {location}</span>
        </div>
    );
}

export function EventActions({
    slug,
    registrationLink,
    showRegistration = true,
    youtube
}: {
    slug: string;
    registrationLink?: string;
    showRegistration?: boolean;
    youtube?: string;
}) {
    return (
        <div className="flex gap-3">
            <Link
                href={`/events/${slug}`}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-purple-900 hover:bg-purple-800 rounded-md"
            >
                View Details
            </Link>
            {youtube && (
                <Link
                    href={youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#FF0000] hover:bg-[#FF0000]/80 rounded-md transition-colors"
                    aria-label="Watch on YouTube"
                >
                    <YouTubeIcon width={16} height={16} color="white" />
                </Link>
            )}
            {registrationLink && showRegistration && (
                <Link
                    href={registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 rounded-md"
                >
                    Register
                </Link>
            )}
        </div>
    );
}

export function EventCard({ event, isUpcoming, isPastEvent }: EventCardProps) {
    const cardContent = (
        <div className="flex flex-col md:flex-row gap-4">
            <EventDateBadge day={event.day} month={event.month} year={event.year} />
            <div className="md:w-3/4">
                <h3 className="text-xl font-bold mb-2 text-white">
                    {event.title}
                </h3>
                <p className="text-gray-300 mb-4">{event.description}</p>

                {isUpcoming ? (
                    <EventMetadata
                        formattedDate={event.formattedDate}
                        time={event.time}
                        location={event.location}
                    />
                ) : (
                    <EventMetadataPast date={event.date} location={event.location} />
                )}

                <EventActions
                    slug={event.slug}
                    registrationLink={event.registrationLink}
                    showRegistration={isUpcoming}
                    youtube={event.youtube}
                />
            </div>
        </div>
    );

    if (isUpcoming) {
        return (
            <div className="relative p-[1px] bg-gradient-to-r from-red-500 to-purple-600 rounded-lg hover:from-red-600 hover:to-purple-700 transition-all duration-300">
                <div className="rounded-lg p-6 bg-[#0c0c1d]/80 hover:bg-[#0c0c1d]/90 transition-colors">
                    {cardContent}
                </div>
            </div>
        );
    }

    return (
        <div className="border border-purple-900 rounded-lg p-6 bg-[#0c0c1d]/80 hover:border-purple-700 transition-colors">
            {cardContent}
        </div>
    );
}
