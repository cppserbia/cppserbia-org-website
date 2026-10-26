// @vitest-environment node
import { describe, expect, it } from "vitest";

import { parsePayloadText } from "./payload";
import { previewProblems, readOpenGraph } from "./wait-for-live-page";

const BANNER = "https://images.cppserbia.org/events/2026-09-30-Data-Structures.jpg";

// What production serves for an event slug that is not deployed yet: a 200 with the
// site-wide fallback metadata.
const FALLBACK = `<head><meta property="og:title" content="C++ Serbia"/>
<meta property="og:image" content="https://cppserbia.org/en/events/x/opengraph-image?a7a9"/></head>`;

const LIVE = `<head><meta property="og:title" content="Data Structures in Clinical Practice - C++ Serbia Community"/>
<meta property="og:image" content="${BANNER}"/><meta property="og:image:width" content="1200"/></head>`;

describe("readOpenGraph", () => {
  it("reads og properties regardless of attribute order", () => {
    const html = `<meta content="Hello" property="og:title"><meta name="description" content="x">`;
    expect(readOpenGraph(html)).toEqual({ "og:title": "Hello" });
  });

  it("decodes the entities Next.js escapes", () => {
    const html = `<meta property="og:title" content="C++ Serbia &amp;&amp; Microsoft: &quot;It&#x27;s on&quot;"/>`;
    expect(readOpenGraph(html)["og:title"]).toBe(`C++ Serbia && Microsoft: "It's on"`);
  });

  it("keeps the first value of a repeated property", () => {
    const html = `<meta property="og:image" content="a.jpg"/><meta property="og:image" content="b.jpg"/>`;
    expect(readOpenGraph(html)["og:image"]).toBe("a.jpg");
  });
});

describe("previewProblems", () => {
  const expected = { title: "Data Structures in Clinical Practice", imageUrl: BANNER };

  it("is empty once the page serves this event's title and banner", () => {
    expect(previewProblems(LIVE, expected)).toEqual([]);
  });

  it("flags the fallback page served before the deploy is live", () => {
    expect(previewProblems(FALLBACK, expected)).toHaveLength(2);
  });

  it("flags a page whose banner is not the payload's", () => {
    const stale = LIVE.replace(BANNER, "https://cppserbia.org/images/cpp-serbia-preview.png");
    expect(previewProblems(stale, expected)).toEqual([
      'og:image is "https://cppserbia.org/images/cpp-serbia-preview.png", not the event banner',
    ]);
  });

  it("only checks the title when the payload has no banner", () => {
    expect(previewProblems(LIVE, { title: expected.title })).toEqual([]);
  });
});

describe("parsePayloadText", () => {
  it("accepts the payload inside a json code fence, as stored in the PR body", () => {
    expect(parsePayloadText('```json\n{"event_slug": "x"}\n```')).toEqual({ event_slug: "x" });
  });
});
