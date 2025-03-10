import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define protected routes that require admin access
  const isAdminProtectedRoute = path.startsWith("/projects");

  // Define routes that require authentication (any user)
  const isAuthProtectedRoute =
    path.startsWith("/jobs/edit") ||
    path === "/post-job" ||
    path.startsWith("/post-job/");

  // Get the user from the cookie
  const user = request.cookies.get("user")?.value;

  let isAdmin = false;
  let isAuthenticated = false;

  if (user) {
    try {
      const userData = JSON.parse(user);
      // Check for both uppercase and lowercase admin roles
      isAdmin = userData.role === "admin" || userData.role === "ADMIN";
      isAuthenticated = true;
    } catch (error) {
      console.error("Failed to parse user cookie:", error);
    }
  }

  // If it's an admin-protected route and the user is not an admin, redirect to login
  if (isAdminProtectedRoute && !isAdmin) {
    // Create the URL to redirect to
    const redirectUrl = new URL("/admin/login", request.url);
    // Add the original URL as a parameter so we can redirect back after login
    redirectUrl.searchParams.set("from", path);

    return NextResponse.redirect(redirectUrl);
  }

  // If it's an auth-protected route and the user is not authenticated, redirect to login
  if (isAuthProtectedRoute && !isAuthenticated) {
    // Create the URL to redirect to
    const redirectUrl = new URL("/login", request.url);
    // Add the original URL as a parameter so we can redirect back after login
    redirectUrl.searchParams.set("from", path);

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    "/projects/:path*",
    "/jobs/edit/:path*",
    "/post-job",
    "/post-job/:path*",
  ],
};
