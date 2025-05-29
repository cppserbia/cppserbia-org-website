import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import {
  getEventBySlug,
  getAllEventsServer,
  type Event,
} from "@/lib/events-server";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

  return {
    title: `${event.title} - C++ Serbia Community`,
    description: event.description,
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isPastEvent = event.date < today;

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      {/* Header */}
      <section className="relative w-full py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <Link
            href="/events"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Events
          </Link>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-400 to-blue-400">
                {event.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                  <span>{event.formattedDate}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-purple-400" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-purple-950 p-3 rounded-lg text-center">
                <div className="text-sm text-purple-300">{event.month}</div>
                <div className="text-3xl font-bold">{event.day}</div>
                <div className="text-sm text-purple-300">{event.year}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Content */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="border border-purple-900 rounded-lg p-8 bg-[#0c0c1d]/80">
            {event.imageUrl && (
              <div className="mb-8">
                <Image
                  src={event.imageUrl || "/placeholder.svg"}
                  alt={event.title}
                  width={1200}
                  height={600}
                  className="rounded-lg w-full object-cover"
                />
              </div>
            )}

            {event.content ? (
              <div className="prose prose-invert prose-purple max-w-none prose-lg prose-headings:text-white prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-6 prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-white prose-code:text-purple-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:rounded prose-code:font-mono prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:font-mono prose-blockquote:border-l-purple-400 prose-blockquote:text-gray-300 prose-a:text-purple-400 prose-a:hover:text-purple-300">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-4">
                        <Table className="w-auto max-w-md border-0 [&_td:first-child]:pr-3 [&_td:first-child]:py-1 [&_td:first-child]:text-sm [&_td:first-child]:text-gray-400 [&_td:first-child]:font-medium [&_td:first-child]:w-auto [&_td:last-child]:py-1 [&_td:last-child]:text-sm [&_td:last-child]:text-gray-300">
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
                      <p className="mb-4 text-gray-300 leading-relaxed">
                        {children}
                      </p>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-");
                      if (isBlock) {
                        return (
                          <code
                            className={`${className} block bg-gray-900 text-gray-100 p-4 rounded-lg border border-gray-700 overflow-x-auto font-mono`}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className="bg-gray-900 text-purple-300 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-gray-900 border border-gray-700 rounded-lg overflow-x-auto mb-4 font-mono">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-purple-400 pl-4 italic text-gray-300 my-4">
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
                      <ul className="list-disc list-inside mb-4 text-gray-300 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-300">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-white">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-300">{children}</em>
                    ),
                  }}
                >
                  {event.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="prose prose-invert prose-purple max-w-none">
                <p className="text-gray-300 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}

            {event.registrationLink && !isPastEvent && (
              <div className="mt-8">
                <Link
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 rounded-md"
                >
                  Register for this Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
