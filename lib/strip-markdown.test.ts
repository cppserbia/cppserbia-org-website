import { describe, expect, it } from "vitest";

import { stripInlineMarkdown } from "./strip-markdown";

describe("stripInlineMarkdown", () => {
  it("leaves plain text untouched", () => {
    expect(stripInlineMarkdown("Pozivamo vas na okupljanje.")).toBe("Pozivamo vas na okupljanje.");
  });

  it("unwraps bold", () => {
    expect(stripInlineMarkdown("Pozivamo vas na prvi **C++ Serbia Beer Wednesday**!")).toBe(
      "Pozivamo vas na prvi C++ Serbia Beer Wednesday!"
    );
    expect(stripInlineMarkdown("a __bold__ word")).toBe("a bold word");
  });

  it("unwraps italics with either marker", () => {
    expect(stripInlineMarkdown("an *italic* and an _italic_ word")).toBe(
      "an italic and an italic word"
    );
  });

  it("unwraps bold italics — the visible *** case", () => {
    expect(stripInlineMarkdown("this is ***important*** here")).toBe("this is important here");
  });

  it("keeps intraword underscores — identifiers are not emphasis", () => {
    expect(stripInlineMarkdown("std::lower_bound and upper_bound differ")).toBe(
      "std::lower_bound and upper_bound differ"
    );
  });

  it("reduces links to their text", () => {
    expect(
      stripInlineMarkdown(
        "susreli sa [templejt metaprogramiranjem](https://en.wikipedia.org/wiki/Template_metaprogramming)"
      )
    ).toBe("susreli sa templejt metaprogramiranjem");
  });

  it("handles angle-bracketed link destinations with parentheses in the URL", () => {
    expect(
      stripInlineMarkdown(
        "generalizacija podrutina ([subroutines](<https://en.wikipedia.org/wiki/Subroutine_(computer_science)>))"
      )
    ).toBe("generalizacija podrutina (subroutines)");
  });

  it("collapses images to their alt text", () => {
    expect(stripInlineMarkdown("before ![a banner](https://example.org/x.png) after")).toBe(
      "before a banner after"
    );
  });

  it("unwraps inline code", () => {
    expect(stripInlineMarkdown("call `co_await` here")).toBe("call co_await here");
  });

  it("bares autolinks", () => {
    expect(stripInlineMarkdown("see <https://cppserbia.org> for more")).toBe(
      "see https://cppserbia.org for more"
    );
  });

  it("unwraps strikethrough", () => {
    expect(stripInlineMarkdown("it is ~~cancelled~~ rescheduled")).toBe(
      "it is cancelled rescheduled"
    );
  });

  it("strips markup nested inside a link", () => {
    expect(stripInlineMarkdown("[**bold link**](https://example.org)")).toBe("bold link");
  });
});
