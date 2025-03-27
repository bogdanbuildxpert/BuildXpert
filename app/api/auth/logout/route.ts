import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";

// This route exists to handle POST form submissions from the logout function
// We'll convert them to GET requests and clear auth tokens
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const _method = formData.get("_method");

  // Create redirect URL with logout parameters
  const url = new URL(request.url);
  url.searchParams.set("from", "logout");
  url.searchParams.set("t", Date.now().toString());
  url.searchParams.set("cb", Math.random().toString(36).substring(2, 15));

  // Create response with proper headers and cleared cookies
  const response = NextResponse.redirect(url, { status: 303 }); // 303 See Other

  // Set cache control headers
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // List of auth cookies to clear
  const authCookies = [
    "user",
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.callback-url",
    "__Host-next-auth.csrf-token",
    "__Host-next-auth.pkce.code_verifier",
    "next-auth.pkce.code_verifier",
  ];

  // Clear all auth cookies
  for (const cookieName of authCookies) {
    response.cookies.set({
      name: cookieName,
      value: "",
      expires: new Date(0),
      path: "/",
    });
  }

  return response;
}

// Handle GET requests to prevent 405 Method Not Allowed errors
export async function GET(request: NextRequest) {
  // Instead of redirecting, let NextJS handle the route normally
  // Just add some headers and clear cookies if needed
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  // Get URL parameters
  const url = new URL(request.url);

  // Clear auth cookies if the request has logout parameters
  if (
    url.searchParams.get("from") === "logout" ||
    url.searchParams.get("from") === "error"
  ) {
    // List of auth cookies to clear
    const authCookies = [
      "user",
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "__Host-next-auth.csrf-token",
      "__Host-next-auth.pkce.code_verifier",
      "next-auth.pkce.code_verifier",
    ];

    // Clear all auth cookies
    for (const cookieName of authCookies) {
      response.cookies.set({
        name: cookieName,
        value: "",
        expires: new Date(0),
        path: "/",
      });
    }
  }

  return response;
}

// Mark this route as dynamic to prevent caching
export const dynamic = "force-dynamic";
