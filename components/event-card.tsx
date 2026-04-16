import { Temporal } from "@js-temporal/polyfill";
import { Calendar, Clock, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { YouTubeButton } from "@/components/youtube-button";
import { Link } from "@/i18n/navigation";

interface Event {
  slug: string;
  title: string;
  date: Temporal.PlainDate;
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
  isPastEvent?: (date: Temporal.PlainDate) => boolean;
}

export function EventDateBadge({ day, month, year }: { day: string; month: string; year: string }) {
  return (
    <div className="w-full flex-shrink-0 md:w-1/4">
      <div className="rounded-lg bg-purple-950 p-3 text-center">
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
  className = "flex flex-col sm:flex-row sm:items-center gap-3 mb-4 text-sm text-gray-400",
}: {
  formattedDate: string;
  time: string;
  location: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center">
        <Calendar className="mr-2 h-4 w-4 text-purple-400" />
        <span>{formattedDate}</span>
      </div>
      <div className="flex items-center">
        <span className="mr-2 text-purple-400">&bull;</span>
        <Clock className="mr-2 h-4 w-4 text-purple-400" />
        <span>{time}</span>
      </div>
      <div className="flex items-center">
        <span className="mr-2 text-purple-400">&bull;</span>
        <MapPin className="mr-2 h-4 w-4 text-purple-400" />
        <span>{location}</span>
      </div>
    </div>
  );
}

export function EventMetadataPast({
  date,
  location,
  dateLocale = "en-US",
}: {
  date: Temporal.PlainDate;
  location: string;
  dateLocale?: string;
}) {
  const formattedDateTime = date.toLocaleString(dateLocale, {
    dateStyle: "medium",
  });

  return (
    <div className="mb-4 flex items-center text-sm text-gray-400">
      <Calendar className="mr-2 h-4 w-4" />
      <span>
        {formattedDateTime} &bull; {location}
      </span>
    </div>
  );
}

export async function EventActions({
  slug,
  registrationLink,
  showRegistration = true,
  youtube,
}: {
  slug: string;
  registrationLink?: string;
  showRegistration?: boolean;
  youtube?: string;
}) {
  const t = await getTranslations("eventDetail");

  return (
    <div className="flex flex-wrap gap-3 overflow-hidden">
      <Link
        href={`/events/${slug}`}
        className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-purple-900 px-3 py-2 text-sm font-medium text-white hover:bg-purple-800"
      >
        {t("viewDetails")}
      </Link>
      {youtube && <YouTubeButton href={youtube} size="sm" />}
      {registrationLink && showRegistration && (
        <a
          href={registrationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="gradient-brand-button inline-flex flex-shrink-0 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
        >
          {t("register")}
        </a>
      )}
    </div>
  );
}

export function EventCard({ event, isUpcoming }: EventCardProps) {
  const cardContent = (
    <div className="flex flex-col gap-4 overflow-hidden md:flex-row">
      <EventDateBadge day={event.day} month={event.month} year={event.year} />
      <div className="w-full min-w-0 md:w-3/4">
        <h3 className="mb-2 break-words text-xl font-bold text-white">{event.title}</h3>
        <p className="mb-4 break-words text-muted">{event.description}</p>

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
      <div className="gradient-brand-border relative overflow-hidden rounded-lg p-[1px] transition-all duration-300">
        <div className="overflow-hidden rounded-lg bg-[#0c0c1d]/80 p-4 transition-colors hover:bg-[#0c0c1d]/90 sm:p-6">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-purple-900 bg-[#0c0c1d]/80 p-4 transition-colors hover:border-purple-700 sm:p-6">
      {cardContent}
    </div>
  );
}
