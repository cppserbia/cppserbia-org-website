import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import { YouTubeButton } from "@/components/youtube-button";
import { EventSeo } from "@/components/seo/event-seo";
import {
  getEventBySlug,
  getAllEventsServer,
  type Event,
} from "@/lib/events-server";
import { isPastEvent } from "@/lib/temporal";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/code-block";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Generate metadata for the page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    return {
      title: "Event Not Found - C++ Serbia Community",
    };
  }

  const baseUrl = 'https://cppserbia.org';
  const eventUrl = `${baseUrl}/events/${event.slug}`;
  const imageUrl = event.imageUrl || `${baseUrl}/images/logo.png`;

  return {
    title: `${event.title} - C++ Serbia Community`,
    description: event.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: eventUrl,
    },
    openGraph: {
      title: `${event.title} - C++ Serbia Community`,
      description: event.description,
      url: eventUrl,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      siteName: 'C++ Serbia Community',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} - C++ Serbia Community`,
      description: event.description,
      images: [imageUrl],
    },
    keywords: 'C++, programming, Serbia, Belgrade, meetup, technology, software development, community',
  };
}

// Generate static params for all events
export function generateStaticParams() {
  const allEvents = getAllEventsServer();

  return allEvents.map((event: Event) => ({
    slug: event.slug,
  }));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  // Determine if event is in the past
  const isEventPast = isPastEvent(event.date);

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      <EventSeo event={event} />

      {/* Cinematic Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[420px] max-h-[600px] overflow-hidden">
        {/* Background: event image or wallpaper fallback */}
        {event.imageUrl ? (
          <>
            <Image
              src={event.imageUrl}
              alt=""
              fill
              className="object-cover"
              priority
            />
            {/* Color wash: purple for upcoming, desaturated for past */}
            <div className={`absolute inset-0 ${isEventPast ? "bg-gray-900/30" : "bg-purple-950/20"}`} />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('/images/wallpaper.png')" }}
            />
            {/* Typographic date texture for no-image events */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
              <span className="text-[12rem] md:text-[16rem] font-bold text-white/[0.04] leading-none whitespace-nowrap">
                {event.month} {event.day}
              </span>
            </div>
          </>
        )}

        {/* Gradient overlays for text legibility */}
        <div className="absolute inset-0 hero-gradient-bottom" />
        <div className="absolute inset-0 hero-gradient-top" />

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col justify-end px-4 pb-10">
          <div className="max-w-5xl mx-auto w-full">
            <Link
              href="/events"
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
            </Link>

            {/* Status badge */}
            {isEventPast ? (
              <div className="status-past mb-4">Past Event</div>
            ) : (
              <div className="status-upcoming mb-4">
                <span className="pulse-dot" />
                Upcoming Event
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mb-6">
              {event.title}
            </h1>

            {/* Metadata chips */}
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
      <div className="sticky top-16 z-30 bg-[#0c0c1d]/95 backdrop-blur-md border-b border-purple-900/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Condensed date/time */}
          <div className="text-sm text-gray-400 hidden sm:flex items-center gap-3">
            <span>{event.formattedDate}</span>
            <span className="text-gray-600">·</span>
            <span>{event.time}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 ml-auto">
            {event.youtube && (
              <YouTubeButton href={event.youtube} variant="text" size="sm" />
            )}
            {event.registrationLink && !isEventPast && (
              <Link
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-brand-button rounded-md"
              >
                <ExternalLink className="h-4 w-4" />
                Register
              </Link>
            )}
            <a
              href={`/events/${event.slug}/calendar.ics`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-300 border border-purple-500/50 hover:bg-purple-950/50 rounded-md transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </a>
          </div>
        </div>
      </div>

      {/* Gradient divider */}
      <div className="divider-gradient" />

      {/* Two-Column Content */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10">
          {/* Left column: prose content */}
          <div className="flex-1 min-w-0">
            {event.content ? (
              <div className="prose-custom">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-4">
                        <Table className="w-auto max-w-md border-0 [&_td:first-child]:pr-3 [&_td:first-child]:py-1 [&_td:first-child]:text-sm [&_td:first-child]:text-gray-400 [&_td:first-child]:font-medium [&_td:first-child]:w-auto [&_td:last-child]:py-1 [&_td:last-child]:text-sm [&_td:last-child]:text-muted">
                          {children}
                        </Table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <TableHeader className="hidden">
                        {children}
                      </TableHeader>
                    ),
                    tbody: ({ children }) => (
                      <TableBody>
                        {children}
                      </TableBody>
                    ),
                    tr: ({ children }) => (
                      <TableRow className="border-0 hover:bg-transparent">
                        {children}
                      </TableRow>
                    ),
                    th: ({ children }) => (
                      <TableHead className="hidden">
                        {children}
                      </TableHead>
                    ),
                    td: ({ children }) => (
                      <TableCell className="border-0 p-0">
                        {children}
                      </TableCell>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-4xl font-bold mb-4 mt-6 text-white">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold mb-3 mt-5 text-white">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-bold mb-3 mt-4 text-white">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg font-bold mb-2 mt-3 text-white">
                        {children}
                      </h4>
                    ),
                    h5: ({ children }) => (
                      <h5 className="text-base font-bold mb-2 mt-3 text-white">
                        {children}
                      </h5>
                    ),
                    h6: ({ children }) => (
                      <h6 className="text-sm font-bold mb-2 mt-3 text-white">
                        {children}
                      </h6>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-muted leading-relaxed">
                        {children}
                      </p>
                    ),
                    code: ({ children, className }) => {
                      const inline = !className?.includes("language-");
                      return (
                        <CodeBlock
                          className={className}
                          inline={inline}
                        >
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      );
                    },
                    pre: ({ children }) => (
                      <div className="my-4">
                        {children}
                      </div>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-purple-400 pl-4 italic text-muted my-4">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-purple-400 hover:text-purple-300 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 text-muted">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 text-muted">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li>{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-muted">{children}</em>
                    ),
                  }}
                >
                  {event.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="prose prose-invert prose-purple max-w-none">
                <p className="text-muted leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-36 flex flex-col gap-6">
              {/* Gradient divider (mobile only, above sidebar) */}
              <div className="divider-gradient-subtle lg:hidden" />

              {/* Date card */}
              <div className={`rounded-lg p-5 text-center ${isEventPast ? "border border-gray-800 bg-gray-900/30" : "border border-purple-900/60 bg-purple-950/30"}`}>
                <div className={`text-sm font-medium ${isEventPast ? "text-gray-400" : "text-purple-300"}`}>
                  {event.month}
                </div>
                <div className="text-5xl font-bold my-1 text-white">
                  {event.day}
                </div>
                <div className={`text-sm ${isEventPast ? "text-gray-400" : "text-purple-300"}`}>
                  {event.year}
                </div>
                <div className="divider-gradient-subtle my-3" />
                <div className="text-sm text-gray-300">{event.time}</div>
                <div className="text-sm text-gray-400 mt-1">{event.location}</div>
              </div>

              {/* Sidebar action buttons */}
              <div className="flex flex-col gap-3">
                {event.registrationLink && !isEventPast && (
                  <Link
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white gradient-brand-button rounded-md w-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Register for Event
                  </Link>
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
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-purple-300 border border-purple-500/50 hover:bg-purple-950/50 rounded-md transition-colors w-full"
                >
                  <Calendar className="h-4 w-4" />
                  Add to Calendar
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
