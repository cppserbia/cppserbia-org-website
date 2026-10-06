import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/events-server", async () => {
  const { Temporal } = await import("@js-temporal/polyfill");
  return {
    getAllEventsServer: vi.fn(() => [
      {
        slug: "test-event",
        title: "Test Event",
        description: "Test Description",
        location: "Test Location",
        // 1 Jan is CET (UTC+1); no endDateTime, so the route defaults to +2 hours
        startDateTime: Temporal.ZonedDateTime.from("2023-01-01T10:00[Europe/Belgrade]"),
      },
    ]),
  };
});

describe("ICS Feed", () => {
  it("generates valid ICS file", async () => {
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("BEGIN:VEVENT");
    expect(text).toContain("SUMMARY:Test Event");
    expect(text).toContain("DESCRIPTION:Test Description");
    expect(text).toContain("LOCATION:Test Location");
    expect(text).toContain("DTSTART:20230101T090000Z");
    expect(text).toContain("DTEND:20230101T110000Z");
  });
});
