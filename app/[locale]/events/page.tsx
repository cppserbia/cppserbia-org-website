import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { EventCard } from "@/components/event-card";
import { ICalFeedButton } from "@/components/ical-feed-button";
import { RSSFeedButton } from "@/components/rss-feed-button";
import { EventsListSeo } from "@/components/seo/events-list-seo";
import { Link } from "@/i18n/navigation";
import { getEventsByDate } from "@/lib/events-server";
import { isPastEvent } from "@/lib/temporal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventsPage" });
  const baseUrl = "https://cppserbia.org";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}/events`,
      languages: {
        en: `${baseUrl}/en/events`,
        sr: `${baseUrl}/sr/events`,
        "x-default": `${baseUrl}/en/events`,
      },
    },
  };
}

export default async function EventsPage() {
  const t = await getTranslations("eventsPage");
  const { upcomingEvents, pastEvents } = getEventsByDate();

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0c1d] text-white">
      <EventsListSeo upcomingEvents={upcomingEvents} pastEvents={pastEvents} />

      {/* Header */}
      <section className="section-spacing relative w-full overflow-hidden sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 mx-auto max-w-5xl">
          <Link href="/" className="text-gray-hover mb-6 inline-flex items-center">
            <ArrowLeft className="mr-2 h-5 w-5" /> {t("backToHome")}
          </Link>
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h1 className="gradient-brand-text mb-4 text-3xl font-bold md:text-5xl">
                {t("heading")}
              </h1>
              <p className="max-w-2xl text-lg text-muted">{t("subtitle")}</p>
            </div>
            <div className="flex-shrink-0">
              <Image src="/images/logo.png" alt="C++ Serbia Logo" width={108} height={120} />
            </div>
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-purple-300 md:text-3xl">{t("upcoming")}</h2>
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
              <p className="py-8 text-center text-gray-400">{t("emptyUpcoming")}</p>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <span className="text-center text-sm text-gray-400">{t("subscribeFeed")}</span>
            <div className="flex gap-2">
              <RSSFeedButton />
              <ICalFeedButton />
            </div>
          </div>
        </div>
      </section>

      {/* Past Events Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-purple-300 md:text-3xl">{t("past")}</h2>

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
              <p className="py-8 text-center text-gray-400">{t("emptyPast")}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
