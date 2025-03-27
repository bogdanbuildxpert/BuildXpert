import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

// Set as dynamic to ensure it always runs on the server
export const dynamic = "force-dynamic";

// Mark this route as dynamic since it uses request parameters and cookies
export const dynamic = "force-dynamic";

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
      // Extract user information
      const userInfo = {
        id: token?.id || token?.sub,
        email: token?.email,
        name: token?.name,
        role: token?.role || "USER",
      };

      // Set a more accessible user-role cookie to help with admin checks
      // This avoids having to decode the JWT token in different places
      const cookieStore = cookies();
      cookieStore.set("user-role", String(userInfo.role), {
        httpOnly: false, // Allow JavaScript access
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: "lax",
        secure:
          process.env.NODE_ENV === "production" ||
          process.env.NEXTAUTH_URL?.startsWith("https"),
      });

      return new NextResponse(
        JSON.stringify({
          authenticated: true,
          method: token ? "token" : "cookie",
          user: userInfo,
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
