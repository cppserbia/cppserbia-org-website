// @vitest-environment node
import { describe, expect, it } from "vitest";

import { extractImageUrl } from "./upload-speaker-avatar";

describe("extractImageUrl", () => {
  it("extracts the URL from a GitHub user-attachment markdown image", () => {
    const body = "/banner-avatar\n\n![](https://github.com/user-attachments/assets/abc-123-def)\n";
    expect(extractImageUrl(body)).toBe("https://github.com/user-attachments/assets/abc-123-def");
  });

  it("supports alt text inside the markdown image", () => {
    const body =
      "/banner-avatar ![speaker headshot](https://github.com/user-attachments/assets/uuid)";
    expect(extractImageUrl(body)).toBe("https://github.com/user-attachments/assets/uuid");
  });

  it("returns the first image when multiple are present", () => {
    const body = `/banner-avatar
![first](https://example.com/a.png)
![second](https://example.com/b.png)`;
    expect(extractImageUrl(body)).toBe("https://example.com/a.png");
  });

  it("falls back to a bare URL with an image extension", () => {
    const body = "/banner-avatar https://example.com/avatar.jpg";
    expect(extractImageUrl(body)).toBe("https://example.com/avatar.jpg");
  });

  it("handles bare URLs with query strings", () => {
    const body = "/banner-avatar https://cdn.example.com/me.png?v=2";
    expect(extractImageUrl(body)).toBe("https://cdn.example.com/me.png?v=2");
  });

  it("prefers a markdown image over a bare image URL", () => {
    const body = `/banner-avatar
First a bare URL: https://example.com/wrong.png
Then a real image: ![](https://example.com/right.jpg)`;
    expect(extractImageUrl(body)).toBe("https://example.com/right.jpg");
  });

  it("is case-insensitive for the bare-URL extension", () => {
    const body = "https://EXAMPLE.com/me.JPG";
    expect(extractImageUrl(body)).toBe("https://EXAMPLE.com/me.JPG");
  });

  it("returns null when the comment carries no image", () => {
    expect(extractImageUrl("/banner-avatar")).toBeNull();
    expect(extractImageUrl("just some text")).toBeNull();
    expect(extractImageUrl("")).toBeNull();
  });

  it("returns null when the only link points at a non-image", () => {
    expect(extractImageUrl("/banner-avatar https://example.com/page")).toBeNull();
  });
});
