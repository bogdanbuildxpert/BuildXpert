import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  // Only usable in production for emergencies
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      { error: "Only available in production" },
      { status: 403 }
    );
  }

  // Create a temporary access token
  const tempUser = {
    id: `temp-${randomUUID()}`,
    name: "Temporary User",
    email: `temp-${Date.now()}@buildxpert.com`,
    role: "CLIENT",
    timestamp: new Date().toISOString(),
  };

  try {
    // Set the user cookie with a short expiration
    const cookieOptions = `; path=/; max-age=3600; SameSite=Lax`;
    const headers = new Headers();

    // Set cache prevention headers
    headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    headers.set(
      "Set-Cookie",
      `user=${encodeURIComponent(JSON.stringify(tempUser))}${cookieOptions}`
    );

    console.log("Generated temporary auth for emergency post-job access");

    // Return success with the temp user data
    return new NextResponse(
      JSON.stringify({
        success: true,
        user: tempUser,
        message: "Temporary authentication created",
        redirectTo: "/post-job?bypass=true",
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error("Error creating temporary auth:", error);
    return NextResponse.json(
      { error: "Failed to create temporary auth" },
      { status: 500 }
    );
  }
}
