import { ArrowLeft, Calendar, Clock, ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "@/components/code-block";
import { EventSeo } from "@/components/seo/event-seo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { YouTubeButton } from "@/components/youtube-button";
import { Link } from "@/i18n/navigation";
import { type Event, getAllEventsServer, getEventBySlug } from "@/lib/events-server";
import { isPastEvent } from "@/lib/temporal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventDetail" });
  const mt = await getTranslations({ locale, namespace: "metadata" });
  const event = getEventBySlug(slug);

  if (!event) {
    return {
      title: t("notFoundTitle"),
    };
  }

  const baseUrl = "https://cppserbia.org";
  const eventUrl = `${baseUrl}/${locale}/events/${event.slug}`;
  const imageUrl = event.imageUrl || `${baseUrl}/images/cpp-serbia-preview.png`;
  const titleWithSuffix = `${event.title} - ${mt("communitySuffix")}`;

  return {
    title: titleWithSuffix,
    description: event.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: eventUrl,
      languages: {
        en: `${baseUrl}/en/events/${event.slug}`,
        sr: `${baseUrl}/sr/events/${event.slug}`,
        "x-default": `${baseUrl}/en/events/${event.slug}`,
      },
    },
    openGraph: {
      title: titleWithSuffix,
      description: event.description,
      url: eventUrl,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      locale: locale === "sr" ? "sr_RS" : "en_US",
      siteName: "C++ Serbia",
    },
    twitter: {
      card: "summary_large_image",
      title: titleWithSuffix,
      description: event.description,
      images: [imageUrl],
      creator: "@cppserbia",
      site: "@cppserbia",
    },
    keywords: [
      "C++",
      "programming",
      "Serbia",
      "Belgrade",
      "meetup",
      "technology",
      "software development",
      "community",
    ],
  };
}

export function generateStaticParams() {
  const allEvents = getAllEventsServer();

  return allEvents.map((event: Event) => ({
    slug: event.slug,
  }));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("eventDetail");
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const isEventPast = isPastEvent(event.date);

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0c1d] text-white">
      <EventSeo event={event} />

      {/* Cinematic Hero Section */}
      <section className="relative h-[60vh] max-h-[600px] min-h-[420px] w-full overflow-hidden">
        {event.imageUrl ? (
          <>
            <Image src={event.imageUrl} alt="" fill className="object-cover" priority />
            <div
              className={`absolute inset-0 ${isEventPast ? "bg-gray-900/30" : "bg-purple-950/20"}`}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('/images/wallpaper.png')" }}
            />
            <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden">
              <span className="whitespace-nowrap text-[12rem] font-bold leading-none text-white/[0.04] md:text-[16rem]">
                {event.month} {event.day}
              </span>
            </div>
          </>
        )}

        <div className="hero-gradient-bottom absolute inset-0" />
        <div className="hero-gradient-top absolute inset-0" />

        <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-10">
          <div className="mx-auto w-full max-w-5xl">
            <Link
              href="/events"
              className="mb-6 inline-flex items-center text-sm text-gray-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("backToEvents")}
            </Link>

            {isEventPast ? (
              <div className="status-past mb-4">{t("pastEvent")}</div>
            ) : (
              <div className="status-upcoming mb-4">
                <span className="pulse-dot" />
                {t("upcomingEvent")}
              </div>
            )}

            <h1 className="mb-6 max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-3">
              <span className="chip-glass">
                <Calendar className="h-4 w-4 text-purple-300" />
                {event.formattedDate}
              </span>
              <span className="chip-glass">
                <Clock className="h-4 w-4 text-purple-300" />
                {event.time}
              </span>
              <span className="chip-glass">
                <MapPin className="h-4 w-4 text-purple-300" />
                {event.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Action Bar */}
      <div className="sticky top-16 z-30 border-b border-purple-900/30 bg-[#0c0c1d]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="hidden items-center gap-3 text-sm text-gray-400 sm:flex">
            <span>{event.formattedDate}</span>
            <span className="text-gray-600">&middot;</span>
            <span>{event.time}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {event.youtube && <YouTubeButton href={event.youtube} variant="text" size="sm" />}
            {event.registrationLink && !isEventPast && (
              <a
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="gradient-brand-button inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white"
              >
                <ExternalLink className="h-4 w-4" />
                {t("register")}
              </a>
            )}
            <a
              href={`/events/${event.slug}/calendar.ics`}
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/50 px-3 py-2 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-950/50"
            >
              <Calendar className="h-4 w-4" />
              {t("calendar")}
            </a>
          </div>
        </div>
      </div>

      <div className="divider-gradient" />

      {/* Two-Column Content */}
      <section className="px-4 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row">
          <div className="min-w-0 flex-1">
            {event.content ? (
              <div className="prose-custom">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-4">
                        <Table className="w-auto max-w-md border-0 [&_td:first-child]:w-auto [&_td:first-child]:py-1 [&_td:first-child]:pr-3 [&_td:first-child]:text-sm [&_td:first-child]:font-medium [&_td:first-child]:text-gray-400 [&_td:last-child]:py-1 [&_td:last-child]:text-sm [&_td:last-child]:text-muted">
                          {children}
                        </Table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <TableHeader className="hidden">{children}</TableHeader>
                    ),
                    tbody: ({ children }) => <TableBody>{children}</TableBody>,
                    tr: ({ children }) => (
                      <TableRow className="border-0 hover:bg-transparent">{children}</TableRow>
                    ),
                    th: ({ children }) => <TableHead className="hidden">{children}</TableHead>,
                    td: ({ children }) => (
                      <TableCell className="border-0 p-0">{children}</TableCell>
                    ),
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-6 text-4xl font-bold text-white">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-5 text-2xl font-bold text-white">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-4 text-xl font-bold text-white">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="mb-2 mt-3 text-lg font-bold text-white">{children}</h4>
                    ),
                    h5: ({ children }) => (
                      <h5 className="mb-2 mt-3 text-base font-bold text-white">{children}</h5>
                    ),
                    h6: ({ children }) => (
                      <h6 className="mb-2 mt-3 text-sm font-bold text-white">{children}</h6>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-relaxed text-muted">{children}</p>
                    ),
                    code: ({ children, className }) => {
                      const inline = !className?.includes("language-");
                      return (
                        <CodeBlock className={className} inline={inline}>
                          {String(children).replace(/\n$/, "")}
                        </CodeBlock>
                      );
                    },
                    pre: ({ children }) => <div className="my-4">{children}</div>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-purple-400 pl-4 italic text-muted">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-purple-400 underline hover:text-purple-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 list-inside list-disc text-muted">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 list-inside list-decimal text-muted">{children}</ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-muted">{children}</em>,
                  }}
                >
                  {event.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="prose prose-purple prose-invert max-w-none">
                <p className="leading-relaxed text-muted">{event.description}</p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="flex-shrink-0 lg:w-72">
            <div className="flex flex-col gap-6 lg:sticky lg:top-36">
              <div className="divider-gradient-subtle lg:hidden" />

              <div
                className={`rounded-lg p-5 text-center ${isEventPast ? "border border-gray-800 bg-gray-900/30" : "border border-purple-900/60 bg-purple-950/30"}`}
              >
                <div
                  className={`text-sm font-medium ${isEventPast ? "text-gray-400" : "text-purple-300"}`}
                >
                  {event.month}
                </div>
                <div className="my-1 text-5xl font-bold text-white">{event.day}</div>
                <div className={`text-sm ${isEventPast ? "text-gray-400" : "text-purple-300"}`}>
                  {event.year}
                </div>
                <div className="divider-gradient-subtle my-3" />
                <div className="text-sm text-gray-300">{event.time}</div>
                <div className="mt-1 text-sm text-gray-400">{event.location}</div>
              </div>

              <div className="flex flex-col gap-3">
                {event.registrationLink && !isEventPast && (
                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gradient-brand-button inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("registerForEvent")}
                  </a>
                )}
                {event.youtube && (
                  <YouTubeButton
                    href={event.youtube}
                    variant="text"
                    className="w-full justify-center"
                  />
                )}
                <a
                  href={`/events/${event.slug}/calendar.ics`}
                  download
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-purple-500/50 px-3 py-2.5 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-950/50"
                >
                  <Calendar className="h-4 w-4" />
                  {t("addToCalendar")}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
