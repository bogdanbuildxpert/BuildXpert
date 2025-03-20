import { NextRequest, NextResponse } from "next/server";

// Disabled messages API
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Chat feature temporarily disabled",
      status: "maintenance",
    },
    {
      status: 503,
      headers: {
        "Retry-After": "86400", // Try again in 24 hours
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Chat feature temporarily disabled",
      status: "maintenance",
    },
    {
      status: 503,
      headers: {
        "Retry-After": "86400", // Try again in 24 hours
        "Cache-Control": "no-store",
      },
    }
  );
}
