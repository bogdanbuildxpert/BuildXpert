import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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

    // Get the NextAuth session token only
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

    // Check authentication status - only using NextAuth token
    const isAuthenticated = !!token;

    if (isAuthenticated) {
      // Extract user information from token
      const userInfo = {
        id: token!.sub,
        email: token!.email,
        name: token!.name,
        role: token!.role || "USER",
      };

      console.log(
        "[AUTH CHECK API] Authentication successful, user info:",
        userInfo
      );

      // Create a response object with user info
      return NextResponse.json(
        {
          authenticated: true,
          method: "nextauth",
          user: userInfo,
        },
        {
          status: 200,
          headers,
        }
      );
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
