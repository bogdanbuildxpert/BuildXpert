"use client";

import { useEffect, useState } from "react";
import { JobFormProvider } from "@/lib/contexts/job-form-context";
import Stepper from "@/components/Stepper";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// We need to extend the AuthContextType for this component
interface ExtendedAuth {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
  forceRefresh?: () => Promise<void>;
  login?: (userData: any) => Promise<void>;
}

export default function PostJobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth() as ExtendedAuth;
  const { user, isLoading } = auth;
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Auth handling moved here from individual pages
  useEffect(() => {
    // Skip if we're already checking auth
    if (isCheckingAuth) return;

    setIsCheckingAuth(true);

    const checkAuth = async () => {
      try {
        // Add timestamp for debugging
        console.log(
          `[${new Date().toISOString()}] Starting auth check for post-job page`
        );

        // PRODUCTION FIX: Directly check cookies first before any other logic
        if (process.env.NODE_ENV === "production") {
          console.log(
            "Production environment detected, checking cookies directly"
          );

          // Try to extract a user cookie directly from document.cookie (client-side only)
          const cookies = document.cookie.split(";");
          const userCookie = cookies.find((cookie) =>
            cookie.trim().startsWith("user=")
          );

          if (userCookie) {
            try {
              const decodedValue = decodeURIComponent(userCookie.split("=")[1]);
              const cookieUser = JSON.parse(decodedValue);

              if (cookieUser && cookieUser.id) {
                console.log("Found valid user cookie, forcing authentication", {
                  id: cookieUser.id,
                  role: cookieUser.role,
                  email: cookieUser.email,
                });

                // Force update the auth context if login is available
                if (!user && auth.login) {
                  await auth.login(cookieUser);
                  console.log("Forced login with cookie data");
                  return;
                }
              }
            } catch (e) {
              console.error("Failed to parse user cookie:", e);
            }
          } else {
            console.log("No user cookie found in document.cookie");
          }
        }

        // If we already have a user, we can skip the rest of the authentication checks
        if (user) {
          console.log("User already authenticated:", user.email);
          return;
        }

        // Check for production environment and handle specially
        if (process.env.NODE_ENV === "production") {
          // Add a direct authentication check for post-job page
          const timestamp = Date.now();
          const authCheckUrl = `/api/auth/check?path=/post-job&t=${timestamp}`;
          console.log(`Making auth check request to: ${authCheckUrl}`);

          try {
            const response = await fetch(authCheckUrl, {
              method: "GET",
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
              credentials: "include",
            });

            console.log(`Auth check response status: ${response.status}`);

            if (!response.ok) {
              console.log("Auth check failed, redirecting to login");
              // Force a navigation to login with cache-busting parameters
              window.location.href = `/login?redirect=/post-job&nocache=${timestamp}`;
              return;
            }

            const data = await response.json();

            // If we get here, authentication succeeded
            console.log("Auth check passed, continuing to post-job page", data);

            // Additional check: if we got user data but no user in context, force login
            if (data.authenticated && data.user && !user && auth.login) {
              await auth.login(data.user);
              console.log("Forced login with API data");
              return;
            }
          } catch (error) {
            console.error("Error checking auth:", error);
            // On error in production, redirect to login
            const timestamp = Date.now();
            window.location.href = `/login?redirect=/post-job&error=fetch&nocache=${timestamp}`;
            return;
          }
        }

        // Only try to refresh if we're not already loading and don't have a user
        if (!isLoading && !user && auth.forceRefresh) {
          console.log("No user detected, refreshing auth state...");
          await auth.forceRefresh();

          // After refresh, check if we have a user now
          if (!user) {
            console.log(
              "Still no authenticated user found after refresh, redirecting to login page"
            );
            // Add state parameter to track the redirect and prevent caching
            const timestamp = Date.now();
            // In production, use a more direct approach to ensure the redirect works
            if (
              typeof window !== "undefined" &&
              process.env.NODE_ENV === "production"
            ) {
              console.log(
                "Production environment detected, using direct window.location for redirect"
              );
              window.location.href = `/login?redirect=/post-job&state=${timestamp}&nocache=${timestamp}`;
              return;
            } else {
              router.push(
                `/login?redirect=/post-job&state=${timestamp}&nocache=${timestamp}`
              );
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast.error("Authentication error. Please try logging in again.");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    // Run the auth check on component mount
    checkAuth();
  }, [auth, isLoading, router, user, isCheckingAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <JobFormProvider>
      <div className="container mx-auto p-4 max-w-4xl mt-6">
        <h1 className="text-2xl font-bold mb-6">Post a Painting Job</h1>
        <Stepper />
        <div className="mt-8 border border-border rounded-lg p-6 shadow-sm bg-white">
          {children}
        </div>
      </div>
    </JobFormProvider>
  );
}
