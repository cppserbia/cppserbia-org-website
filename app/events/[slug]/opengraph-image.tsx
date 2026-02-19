import { ImageResponse } from "next/og";
import { getEventBySlug } from "@/lib/events-server";
import fs from "fs";
import path from "path";

export const alt = "C++ Serbia Community Event";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0c0c1d",
            color: "white",
            fontSize: 48,
          }}
        >
          Event Not Found
        </div>
      ),
      { ...size }
    );
  }

  // Load Rubik Bold font
  const rubikBold = await fetch(
    "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4iFWkU1Z4Y.ttf"
  ).then((res) => res.arrayBuffer());

  // Load logo as base64 data URL
  const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  // Format date for display
  const dateStr = event.formattedDate;
  const timeStr = event.time;
  const locationStr = event.location;

  // Truncate title if too long
  const title =
    event.title.length > 80
      ? event.title.substring(0, 77) + "..."
      : event.title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0c0c1d",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dimmed background image when available */}
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.15,
            }}
          />
        )}

        {/* Content overlay */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: "48px 60px",
            position: "relative",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Logo + community name */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoBase64}
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: 8 }}
            />
            <span
              style={{
                marginLeft: 16,
                fontSize: 24,
                color: "#a78bfa",
                fontFamily: "Rubik",
                fontWeight: 700,
              }}
            >
              C++ Serbia Community
            </span>
          </div>

          {/* Center: Event title with gradient */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              padding: "20px 0",
            }}
          >
            <div
              style={{
                fontSize: title.length > 50 ? 44 : 56,
                fontFamily: "Rubik",
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.2,
                backgroundImage:
                  "linear-gradient(to right, #ef4444, #c084fc, #60a5fa)",
                backgroundClip: "text",
                color: "transparent",
                padding: "0 20px",
              }}
            >
              {title}
            </div>

            {/* Metadata row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: 24,
                fontSize: 22,
                color: "#9ca3af",
                gap: 24,
              }}
            >
              <span>{dateStr}</span>
              <span style={{ color: "#7c3aed" }}>•</span>
              <span>{timeStr}</span>
              <span style={{ color: "#7c3aed" }}>•</span>
              <span>{locationStr}</span>
            </div>
          </div>

          {/* Bottom: Gradient accent line */}
          <div
            style={{
              width: "100%",
              height: 4,
              backgroundImage:
                "linear-gradient(to right, #ef4444, #a855f7, #3b82f6)",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Rubik",
          data: rubikBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
