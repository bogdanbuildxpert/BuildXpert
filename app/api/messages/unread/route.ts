import { NextRequest, NextResponse } from "next/server";

// Revalidation frequency set to 24 hours in seconds
export const revalidate = 86400;

// Block all repeated calls
export const dynamic = "force-static";

// This will cache successful responses for 24 hours
// Modified API route to return empty data without errors
export async function GET(request: NextRequest) {
  // Add console logging to trace calling code
  console.log("GET /api/messages/unread request received:", {
    url: request.url,
    referrer: request.headers.get("referer"),
    origin: request.headers.get("origin"),
  });

  // During build time or static export, just return empty data
  // This helps prevent database connection attempts during build
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    console.log("[messages/unread] Returning static data during build");
  }

  // Create strong cache headers to prevent repeated calls
  return NextResponse.json(
    {
      unreadCount: 0,
      _note: "Using Socket.IO for real-time notifications",
      cached: true,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        // Set aggressive caching
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
        "Content-Type": "application/json",
        // Prevent revalidation
        "Surrogate-Control": "max-age=86400",
        "CDN-Cache-Control": "max-age=86400",
        "Vercel-CDN-Cache-Control": "max-age=86400",
        // Add timestamps to ensure uniqueness
        "Last-Modified": new Date().toUTCString(),
        Date: new Date().toUTCString(),
      },
    }
  );
}
