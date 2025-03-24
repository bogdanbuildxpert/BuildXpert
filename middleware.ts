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

  // Set CORS headers for API routes
  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

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
    path === "/verify-email"
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
    // Check if we just came from login by looking for a 'from' parameter
    // This can happen when the auth cookies aren't fully synchronized yet
    const justAuthenticated =
      request.nextUrl.searchParams.has("just_authenticated");

    if (justAuthenticated) {
      // If we just authenticated, let the request go through without redirection
      // The client-side auth check will handle any remaining issues
      console.log(`Allowing access to ${path} after recent authentication`);
      return NextResponse.next();
    }

    // Create the URL to redirect to
    const redirectUrl = new URL("/login", request.url);
    // Add the original URL as a parameter so we can redirect back after login
    redirectUrl.searchParams.set("from", path);

    console.log(
      `Redirecting unauthenticated user from ${path} to ${redirectUrl.toString()}, auth status: ${JSON.stringify(
        {
          hasToken: !!token,
          hasCookie: !!cookieUser,
          timestamp: new Date().toISOString(),
        }
      )}`
    );
    return NextResponse.redirect(redirectUrl);
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
