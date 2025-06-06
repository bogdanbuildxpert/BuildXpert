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

  // Get the NextAuth session token
  let token = null;
  try {
    // More robust token extraction with specific cookie domain checking
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie:
        process.env.NODE_ENV === "production" ||
        process.env.NEXTAUTH_URL?.startsWith("https"),
      cookieName: "next-auth.session-token",
    });

    // Only log token information for specific routes or when debugging
    const isDebugRoute =
      path.includes("/debug") || path.startsWith("/api/auth/");
    if (token && isDebugRoute) {
      // console.log(`Found NextAuth token for ${path}:`, {
      //   sub: token.sub,
      //   email: token.email,
      //   role: token.role || "not set",
      // });
    } else if (!token && isDebugRoute) {
      // console.log(`No NextAuth token found for ${path}`);

      // Fallback check for cookies manually only in debug routes
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        if (cookieHeader.includes("next-auth.session-token")) {
          // console.log(
          //   `Session token cookie exists but getToken returned null. Possible decoding issue.`
          // );
        }
      } else {
        // console.log(`No cookie header found in request`);
      }
    }
  } catch (tokenError) {
    console.error(`Error retrieving NextAuth token for ${path}:`, tokenError);
  }

  let isAdmin = false;
  let isAuthenticated = !!token;

  if (token) {
    // Check for both uppercase and lowercase admin roles
    isAdmin = token.role === "admin" || token.role === "ADMIN";
  }

  // Only log auth status for specific routes to prevent log spam
  const shouldLogAuthStatus =
    path.startsWith("/admin") ||
    path.startsWith("/api/auth") ||
    path.includes("/debug") ||
    path === "/login";

  if (shouldLogAuthStatus) {
    // console.log(`Auth status for ${path}:`, {
    //   isAuthenticated,
    //   isAdmin,
    //   hasToken: !!token,
    // });
  }

  // If user is already authenticated and trying to access login/register pages,
  // redirect them to the dashboard instead
  if (
    isAuthenticated &&
    (path === "/login" || path === "/register" || path === "/admin/login")
  ) {
    // If admin user, redirect to admin dashboard
    if (isAdmin) {
      // console.log(
      //   `Redirecting authenticated admin from ${path} to /admin/dashboard`
      // );
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    // Regular users to homepage
    // console.log(`Redirecting authenticated user from ${path} to /`);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Skip auth checks for auth-related routes that don't need redirect handling
  if (
    path.startsWith("/api/auth/") ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/verify-email" ||
    path === "/resend-verification" ||
    path === "/debug-login"
  ) {
    // Special handling for the verify-email API endpoint in production
    // This addresses the 405 Method Not Allowed issue when clicking email links
    if (
      path === "/api/auth/verify-email" &&
      process.env.NODE_ENV === "production"
    ) {
      // console.log(
      //   "Production verify-email API access detected, forcing to client route"
      // );
      const token = request.nextUrl.searchParams.get("token");

      if (token) {
        return NextResponse.redirect(
          new URL(`/verify-email?token=${token}`, request.url)
        );
      }
    }

    return response;
  }

  // Define protected routes that require admin access
  const isAdminProtectedRoute =
    path.startsWith("/admin/") && !path.startsWith("/admin/login");

  // Define routes that require authentication (any user)
  const isAuthProtectedRoute =
    path.startsWith("/jobs/edit") ||
    path === "/post-job" ||
    path.startsWith("/post-job/") ||
    path.startsWith("/projects");

  // Special handling for admin users accessing post-job related pages
  // This ensures admins can access the job posting functionality
  if (isAdmin && path.startsWith("/post-job/")) {
    // console.log(`Allowing admin access to ${path} for job posting`);
    return response;
  }

  // If it's an admin-protected route and user is not admin, redirect to login
  if (isAdminProtectedRoute && !isAdmin) {
    // console.log(
    //   `Access to admin protected route ${path} denied, redirecting to login`
    // );
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // If it's a protected route and user is not authenticated, redirect to login
  if (isAuthProtectedRoute && !isAuthenticated) {
    // console.log(
    //   `Access to protected route ${path} denied, redirecting to login`
    // );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // For all other routes, allow access
  return response;
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
