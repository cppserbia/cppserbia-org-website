import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/events-server", async () => {
  const { Temporal } = await import("@js-temporal/polyfill");
  return {
    getEventBySlug: vi.fn((slug) => {
      if (slug === "test-event") {
        return {
          slug: "test-event",
          title: "Test Event",
          description: "Test Description",
          location: "Test Location",
          // 21 Oct is CEST (UTC+2)
          startDateTime: Temporal.ZonedDateTime.from("2026-10-21T17:45[Europe/Belgrade]"),
          endDateTime: Temporal.ZonedDateTime.from("2026-10-21T20:00[Europe/Belgrade]"),
        };
      }
      return null;
    }),
  };
});

describe("Single Event ICS Feed", () => {
  it("generates valid ICS for existing event", async () => {
    const request = new NextRequest("https://cppserbia.org/events/test-event/calendar.ics");
    const params = Promise.resolve({ slug: "test-event" });

    const response = await GET(request, { params });
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("SUMMARY:Test Event");
  });

  it("emits Belgrade wall-clock time as UTC, independent of the server timezone", async () => {
    const request = new NextRequest("https://cppserbia.org/events/test-event/calendar.ics");
    const params = Promise.resolve({ slug: "test-event" });

    const text = await (await GET(request, { params })).text();

    expect(text).toContain("DTSTART:20261021T154500Z");
    expect(text).toContain("DTEND:20261021T180000Z");
  });

  it("returns 404 for non-existent event", async () => {
    const request = new NextRequest("https://cppserbia.org/events/non-existent/calendar.ics");
    const params = Promise.resolve({ slug: "non-existent" });

    const response = await GET(request, { params });

    expect(response.status).toBe(404);
  });
});
