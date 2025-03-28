import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

// Set as dynamic to ensure it always runs on the server and uses request parameters and cookies
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log(
    "[AUTH CHECK API] Request received at:",
    new Date().toISOString()
  );

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
      // Extract user information from either token or cookie
      const userInfo = {
        id: token?.sub || cookieUser?.id,
        email: token?.email || cookieUser?.email,
        name: token?.name || cookieUser?.name,
        role: token?.role || cookieUser?.role || "USER",
      };

      console.log(
        "[AUTH CHECK API] Authentication successful, user info:",
        userInfo
      );

      // Create a response object
      const response = NextResponse.json(
        {
          authenticated: true,
          method: token ? "token" : "cookie",
          user: userInfo,
        },
        {
          status: 200,
          headers,
        }
      );

      // Set multiple auth cookies to maximize compatibility
      const cookieStore = cookies();

      // Set the user cookie (serialized user object)
      cookieStore.set("user", JSON.stringify(userInfo), {
        httpOnly: false, // Allow JavaScript access
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      // Set a simpler user ID cookie
      cookieStore.set("user_id", String(userInfo.id), {
        httpOnly: false,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      // Set a JWT-based auth token for API calls
      const authToken = Buffer.from(
        JSON.stringify({
          id: userInfo.id,
          email: userInfo.email,
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
        })
      ).toString("base64");

      cookieStore.set("auth_token", authToken, {
        httpOnly: false, // Allow JavaScript to access for API calls
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      // Also set a standard role cookie
      cookieStore.set("user-role", String(userInfo.role), {
        httpOnly: false, // Allow JavaScript access
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    } else {
      console.log("[AUTH CHECK API] Authentication failed");
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
