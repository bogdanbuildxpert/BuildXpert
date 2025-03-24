import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  // Add cache control headers to prevent caching
  const headers = new Headers();
  headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  try {
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path") || "/";

    // Check for user cookie as a fallback for authentication
    const userCookie = request.cookies.get("user");
    let cookieUser = null;

    if (userCookie?.value) {
      try {
        cookieUser = JSON.parse(decodeURIComponent(userCookie.value));
        console.log(`[API] Found user cookie for ${path}:`, {
          id: cookieUser.id,
          role: cookieUser.role,
          email: cookieUser.email,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error(`[API] Failed to parse user cookie for ${path}:`, e);
      }
    } else {
      console.log(
        `[API] No user cookie found for ${path}, timestamp: ${new Date().toISOString()}`
      );
    }

    // Get the NextAuth session token
    let token = null;
    try {
      token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token) {
        console.log(`[API] Found NextAuth token for ${path}:`, {
          sub: token.sub,
          email: token.email,
          role: token.role || "not set",
        });
      } else {
        console.log(`[API] No NextAuth token found for ${path}`);
      }
    } catch (tokenError) {
      console.error(
        `[API] Error retrieving NextAuth token for ${path}:`,
        tokenError
      );
    }

    // Check authentication status
    const isAuthenticated = !!token || !!cookieUser;

    if (isAuthenticated) {
      return new NextResponse(
        JSON.stringify({
          authenticated: true,
          method: token ? "token" : "cookie",
          user: token
            ? { id: token.sub, email: token.email, role: token.role }
            : cookieUser,
        }),
        {
          status: 200,
          headers,
        }
      );
    } else {
      return new NextResponse(
        JSON.stringify({
          authenticated: false,
          error: "User not authenticated",
        }),
        {
          status: 401,
          headers,
        }
      );
    }
  } catch (error) {
    console.error("[API] Auth check error:", error);
    return new NextResponse(
      JSON.stringify({
        authenticated: false,
        error: "Authentication check failed",
      }),
      {
        status: 500,
        headers,
      }
    );
  }
}
