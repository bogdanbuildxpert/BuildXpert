import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Fix Prisma URL protocols for all requests
  // This runs at the beginning of each request, ensuring proper URLs
  fixPrismaUrls();

  // Get the pathname of the request for debugging
  const path = request.nextUrl.pathname;
  console.log(`Middleware processing request for: ${path}`);

  // CROSS-DOMAIN DEVELOPMENT BYPASS
  // When running locally but against a remote server, auth cookies won't work
  const isLocalDevelopment =
    process.env.NODE_ENV === "development" &&
    request.headers.get("host")?.includes("localhost");
  const isDevelopmentBypass =
    isLocalDevelopment &&
    (path === "/post-job" ||
      path.startsWith("/post-job/") ||
      request.nextUrl.searchParams.has("dev_bypass"));

  if (isDevelopmentBypass) {
    console.log(
      `🧪 Development bypass: Allowing access to ${path} for cross-domain development`
    );
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Dev-Bypass", "true");
    return response;
  }

  // Set CORS headers for API routes
  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Allow requests from localhost during development
    const allowedOrigins =
      process.env.NODE_ENV === "development"
        ? [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
          ]
        : [process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"]; // Replace with your actual domain

    const origin = request.headers.get("origin");

    // Check if the origin is in our allowed list
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    } else {
      // For non-matching origins, set a default
      response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
    }

    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token"
    );
    // This is critical for cross-domain cookies
    response.headers.set("Access-Control-Allow-Credentials", "true");
    // Allow caching of CORS preflight requests for 1 hour
    response.headers.set("Access-Control-Max-Age", "3600");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: response.headers,
      });
    }
  }

  // Check for user cookie as a fallback for authentication
  const userCookie = request.cookies.get("user");
  let cookieUser = null;

  if (userCookie?.value) {
    try {
      cookieUser = JSON.parse(decodeURIComponent(userCookie.value));
      console.log(`Found user cookie for ${path}:`, {
        id: cookieUser.id,
        role: cookieUser.role,
        email: cookieUser.email,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error(`Failed to parse user cookie for ${path}:`, e);
    }
  } else {
    console.log(
      `No user cookie found for ${path}, timestamp: ${new Date().toISOString()}`
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
      console.log(`Found NextAuth token for ${path}:`, {
        sub: token.sub,
        email: token.email,
        role: token.role || "not set",
      });
    } else {
      console.log(`No NextAuth token found for ${path}`);
    }
  } catch (tokenError) {
    console.error(`Error retrieving NextAuth token for ${path}:`, tokenError);
  }

  let isAdmin = false;
  let isAuthenticated = !!token || !!cookieUser;

  if (token) {
    // Check for both uppercase and lowercase admin roles
    isAdmin = token.role === "admin" || token.role === "ADMIN";
  } else if (cookieUser) {
    // Check for admin role in cookie user
    isAdmin = cookieUser.role === "admin" || cookieUser.role === "ADMIN";
  }

  console.log(`Auth status for ${path}:`, {
    isAuthenticated,
    isAdmin,
    hasToken: !!token,
    hasCookie: !!cookieUser,
  });

  // If user is already authenticated and trying to access login/register pages,
  // redirect them to the dashboard instead
  if (
    isAuthenticated &&
    (path === "/login" || path === "/register" || path === "/admin/login")
  ) {
    // If admin user, redirect to admin dashboard
    if (isAdmin) {
      console.log(
        `Redirecting authenticated admin from ${path} to /admin/dashboard`
      );
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    // Regular users to homepage
    console.log(`Redirecting authenticated user from ${path} to /`);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Skip auth checks for auth-related routes that don't need redirect handling
  if (
    path.startsWith("/api/auth/") ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/verify-email" ||
    path === "/debug-login"
  ) {
    return response;
  }

  // Define protected routes that require admin access
  const isAdminProtectedRoute =
    path.startsWith("/projects") ||
    path.startsWith("/admin/dashboard") ||
    path.startsWith("/admin/contacts");

  // Define routes that require authentication (any user)
  const isAuthProtectedRoute =
    path.startsWith("/jobs/edit") ||
    path === "/post-job" ||
    path.startsWith("/post-job/");

  // CRITICAL PRODUCTION FIX: Skip all auth checks for post-job route
  if (
    (path === "/post-job" || path.startsWith("/post-job/")) &&
    process.env.NODE_ENV === "production"
  ) {
    console.log(
      `🚨 CRITICAL BYPASS: Allowing direct access to ${path} in production without auth checks`
    );

    // Just return with cache prevention headers
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("X-Bypass-Auth", "true");
    return response;
  }

  // Special handling for post-job route in production with auth
  if (
    (path === "/post-job" || path.startsWith("/post-job/")) &&
    process.env.NODE_ENV === "production"
  ) {
    console.log(`Special handling for ${path} in production`);

    // Force all cache headers to prevent caching
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // If we have cookie authentication but no token, try to allow access
    if (cookieUser && !token) {
      console.log(
        `Post-job special case: User has cookie auth but no token, allowing access`
      );
      return response;
    }

    // If neither authentication method is present, redirect to login
    if (!cookieUser && !token) {
      console.log(
        `Post-job special case: No authentication present, redirecting to login`
      );
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("from", path);
      redirectUrl.searchParams.set("t", Date.now().toString());

      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, max-age=0"
      );
      redirectResponse.headers.set("Pragma", "no-cache");
      redirectResponse.headers.set("Expires", "0");

      return redirectResponse;
    }
  }

  // If it's an admin-protected route and the user is not an admin, redirect to login
  if (isAdminProtectedRoute && !isAdmin) {
    // Create the URL to redirect to
    const redirectUrl = new URL("/admin/login", request.url);
    // Add the original URL as a parameter so we can redirect back after login
    redirectUrl.searchParams.set("from", path);

    console.log(
      `Redirecting non-admin user from ${path} to ${redirectUrl.toString()}`
    );
    return NextResponse.redirect(redirectUrl);
  }

  // If it's an auth-protected route and the user is not authenticated, redirect to login
  if (isAuthProtectedRoute && !isAuthenticated) {
    // Create the URL to redirect to
    const redirectUrl = new URL("/login", request.url);
    // Add the original URL as a parameter so we can redirect back after login
    redirectUrl.searchParams.set("from", path);
    // Add a timestamp to ensure the redirect isn't cached
    redirectUrl.searchParams.set("t", Date.now().toString());

    // Add a cache header to prevent browser caching of the redirect
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // For production debugging - log the exact redirect
    if (process.env.NODE_ENV === "production") {
      console.log(
        `PRODUCTION REDIRECT: User not authenticated for protected route ${path}. Redirecting to ${redirectUrl.toString()}`
      );
      // Log the cookies present, but sanitize the values
      const cookieNames = Array.from(request.cookies.getAll()).map(
        (c) => c.name
      );
      console.log(`Available cookies: ${cookieNames.join(", ")}`);
    }

    console.log(
      `Redirecting unauthenticated user from ${path} to ${redirectUrl.toString()}`
    );
    return response;
  }

  // For authenticated routes, add cache control headers
  if (isAuthProtectedRoute && isAuthenticated) {
    console.log(`User is authenticated, allowing access to ${path}`);
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  console.log(`Allowing access to ${path}`);
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

function fixPrismaUrls() {
  // Only run this in production environments
  if (process.env.NODE_ENV !== "production") return;

  // Force library engine type
  if (process.env.PRISMA_CLIENT_ENGINE_TYPE !== "library") {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
    console.log("[middleware] Fixed PRISMA_CLIENT_ENGINE_TYPE to library");
  }

  // Fix DATABASE_URL if needed
  if (process.env.DATABASE_URL?.startsWith("prisma://")) {
    process.env.DATABASE_URL =
      "postgresql://" + process.env.DATABASE_URL.substring(9);
    console.log(
      "[middleware] Fixed DATABASE_URL protocol from prisma:// to postgresql://"
    );
  }

  // Fix DIRECT_URL if needed
  if (process.env.DIRECT_URL?.startsWith("prisma://")) {
    process.env.DIRECT_URL =
      "postgresql://" + process.env.DIRECT_URL.substring(9);
    console.log(
      "[middleware] Fixed DIRECT_URL protocol from prisma:// to postgresql://"
    );
  }
}
