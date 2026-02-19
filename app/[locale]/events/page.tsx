import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getEventsByDate } from "@/lib/events-server";
import { isPastEvent } from "@/lib/temporal";
import { EventCard } from "@/components/event-card";
import { EventsListSeo } from "@/components/seo/events-list-seo";
import { ICalFeedButton } from "@/components/ical-feed-button";
import { RSSFeedButton } from "@/components/rss-feed-button";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'eventsPage' });
  const baseUrl = 'https://cppserbia.org';

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${baseUrl}/${locale}/events`,
      languages: {
        en: `${baseUrl}/en/events`,
        sr: `${baseUrl}/sr/events`,
      },
    },
  };
}

export default async function EventsPage() {
  const t = await getTranslations('eventsPage');
  const { upcomingEvents, pastEvents } = getEventsByDate();

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      <EventsListSeo upcomingEvents={upcomingEvents} pastEvents={pastEvents} />

      {/* Header */}
      <section className="relative w-full section-spacing sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-gray-hover mb-6"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> {t('backToHome')}
          </Link>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 gradient-brand-text">
                {t('heading')}
              </h1>
              <p className="text-lg text-muted max-w-2xl">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="C++ Serbia Logo"
                width={108}
                height={120}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-purple-300">
            {t('upcoming')}
          </h2>
          <div className="grid gap-6 overflow-hidden">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCard
                  key={event.slug}
                  event={event}
                  isUpcoming={true}
                  isPastEvent={isPastEvent}
                />
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                {t('emptyUpcoming')}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <span className="text-sm text-gray-400 text-center">
              {t('subscribeFeed')}
            </span>
            <div className="flex gap-2">
              <RSSFeedButton />
              <ICalFeedButton />
            </div>
          </div>
        </div>
      </section>

      {/* Past Events Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-purple-300">
            {t('past')}
          </h2>

          <div className="grid gap-6 overflow-hidden">
            {pastEvents.length > 0 ? (
              pastEvents.map((event) => (
                <EventCard
                  key={event.slug}
                  event={event}
                  isUpcoming={false}
                  isPastEvent={isPastEvent}
                />
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                {t('emptyPast')}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
