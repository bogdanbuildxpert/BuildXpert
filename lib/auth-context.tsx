"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSession, signOut, getSession, signIn } from "next-auth/react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  password?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: Omit<User, "password">) => Promise<boolean>;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
  forceRefresh: () => void;
}

// 5 hours in milliseconds
const INACTIVITY_TIMEOUT = 5 * 60 * 60 * 1000;
// Warning 5 minutes before logout
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const logoutRef = useRef<() => void>(() => {});

  // The logout function
  const logout = async () => {
    try {
      console.log("Logging out user");

      // Clear React state first
      setUser(null);
      setIsAuthenticated(false);

      // Call NextAuth signOut with explicit redirect: false
      await signOut({ redirect: false });

      // Clear all auth-related timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }

      // Clear all auth-related cookies with secure attributes for production
      const cookieOptions =
        process.env.NODE_ENV === "production"
          ? "; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure"
          : "; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict";

      document.cookie = `next-auth.session-token=${cookieOptions}`;
      document.cookie = `next-auth.csrf-token=${cookieOptions}`;
      document.cookie = `next-auth.callback-url=${cookieOptions}`;
      document.cookie = `__Secure-next-auth.session-token=${cookieOptions}`;
      document.cookie = `__Secure-next-auth.csrf-token=${cookieOptions}`;
      document.cookie = `__Secure-next-auth.callback-url=${cookieOptions}`;
      document.cookie = `user=${cookieOptions}`;

      // Clear localStorage as well
      localStorage.removeItem("user");

      console.log("Successfully cleared auth state and cookies");

      // Force a page reload to ensure all auth state is cleared
      if (typeof window !== "undefined") {
        // Add cache-busting parameter
        window.location.href = `/login?t=${Date.now()}`;
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Keep logout reference updated
  useEffect(() => {
    logoutRef.current = logout;
  }, []);

  // Function to reset the inactivity timer using useCallback
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Reset warning flag
    warningShownRef.current = false;

    // Update last activity timestamp
    lastActivityRef.current = Date.now();

    // Only set new timers if the user is logged in
    if (user) {
      // Set warning timer (5 minutes before logout)
      warningTimerRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          toast.warning(
            "You'll be logged out in 5 minutes due to inactivity. Move your mouse or press a key to stay logged in.",
            {
              duration: 10000, // Show for 10 seconds
              id: "inactivity-warning", // Prevent duplicate toasts
            }
          );
        }
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT);

      // Set logout timer
      inactivityTimerRef.current = setTimeout(() => {
        // Check if the time since last activity exceeds the timeout
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          console.log("Logging out due to inactivity");
          toast.info("You've been logged out due to inactivity", {
            duration: 5000,
          });
          logoutRef.current();
        }
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]); // Only depend on user

  // Set up event listeners for user activity
  useEffect(() => {
    const activityEvents = ["mousedown", "keypress", "scroll", "touchstart"];

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    // Initialize the timer
    resetInactivityTimer();

    // Clean up event listeners on unmount
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [resetInactivityTimer]); // Re-run when resetInactivityTimer changes

  const login = async (userData: Omit<User, "password">): Promise<boolean> => {
    try {
      console.log("Auth context login called with user data:", userData);

      // Verify we have a valid session
      const session = await getSession();
      console.log("Current session in auth context:", session);

      // Even without a valid session, we'll try to log in if we have user data
      // Previously, this was strictly checking for session?.user
      if (!session?.user) {
        console.warn(
          "No valid session found in auth context, but proceeding with direct login"
        );
        // Continue with login instead of returning false
      } else if (session.user.email !== userData.email) {
        console.warn(
          "Session user email does not match provided user data, but proceeding"
        );
        // Continue with login instead of returning false
      }

      // Set the user data in state
      setUser(userData);
      setIsAuthenticated(true);

      // Store in localStorage for persistence
      localStorage.setItem("user", JSON.stringify(userData));

      // Set the user in a cookie for server-side access with proper cross-domain support
      const userJson = JSON.stringify(userData);
      const isProduction = process.env.NODE_ENV === "production";
      const isDevelopment = process.env.NODE_ENV === "development";

      // Set cookie options based on environment
      let cookieOptions = `; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days

      if (isProduction) {
        // For production: SameSite=None allows cross-domain cookies, but requires Secure flag
        cookieOptions += "; SameSite=None; Secure";
      } else if (isDevelopment) {
        // For development: Use Lax to allow basic cross-site requests
        cookieOptions += "; SameSite=Lax";
      }

      document.cookie = `user=${encodeURIComponent(userJson)}${cookieOptions}`;
      console.log(`Set user cookie with options: ${cookieOptions}`);

      console.log("Successfully updated auth context state");

      // Reset the inactivity timer
      resetInactivityTimer();

      return true;
    } catch (error) {
      console.error("Error in auth context login:", error);
      return false;
    }
  };

  // Add a function to handle cross-domain authentication
  const handleCrossDomainAuth = useCallback(async () => {
    // Only run this in development mode for cross-domain scenarios
    if (process.env.NODE_ENV !== "development") return false;

    // Check if we're on localhost but using remote API
    const isLocalhost =
      typeof window !== "undefined" && window.location.hostname === "localhost";
    if (!isLocalhost) return false;

    console.log(
      "Detected cross-domain development scenario (localhost + remote API)"
    );

    try {
      // Try to get remote authentication status
      const timestamp = Date.now();
      const response = await fetch(`/api/auth/check?t=${timestamp}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        if (data.authenticated && data.user) {
          console.log(
            "Cross-domain auth: Found remote authenticated user, syncing locally"
          );
          // Set up local auth state
          setUser(data.user);
          setIsAuthenticated(true);

          // Store in localStorage for persistence
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log(
            "Cross-domain auth: Successfully synced remote auth state to local"
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Cross-domain auth error:", error);
      return false;
    }
  }, []);

  // Update the useEffect for session handling
  useEffect(() => {
    const handleSessionUpdate = async () => {
      try {
        // First try cross-domain auth if applicable
        const crossDomainAuthSuccess = await handleCrossDomainAuth();

        // If cross-domain auth succeeded, we can skip the rest
        if (crossDomainAuthSuccess) {
          setIsLoading(false);
          return;
        }

        // If we have a session from NextAuth, use that
        if (session?.user) {
          const nextAuthUser = {
            id: session.user.id as string,
            name: session.user.name || null,
            email: session.user.email as string,
            role: (session.user as any).role || "CLIENT",
          };

          // Only update if user is different to avoid unnecessary re-renders
          if (!user || user.id !== nextAuthUser.id) {
            console.log("Setting user from NextAuth session:", nextAuthUser);
            setUser(nextAuthUser);

            // Also update localStorage for backward compatibility
            localStorage.setItem("user", JSON.stringify(nextAuthUser));

            // Ensure the cookie is set with proper attributes for production
            const cookieOptions =
              process.env.NODE_ENV === "production"
                ? `; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
                : `; path=/; max-age=${60 * 60 * 24 * 7}`;

            document.cookie = `user=${encodeURIComponent(
              JSON.stringify(nextAuthUser)
            )}${cookieOptions}`;

            console.log("Updated user cookie with session data");
          }

          setIsAuthenticated(true);
        } else {
          // If no NextAuth session, check localStorage as fallback
          const storedUser = localStorage.getItem("user");
          if (storedUser && !user) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log("Setting user from localStorage:", parsedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);

              // Ensure the cookie is set with proper attributes for production
              const cookieOptions =
                process.env.NODE_ENV === "production"
                  ? `; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
                  : `; path=/; max-age=${60 * 60 * 24 * 7}`;

              document.cookie = `user=${encodeURIComponent(
                storedUser
              )}${cookieOptions}`;

              console.log("Updated user cookie from localStorage");

              // Force refresh the session to sync with NextAuth
              if (process.env.NODE_ENV === "production") {
                console.log(
                  "Production environment detected, attempting to refresh Next-Auth session"
                );
                try {
                  // Try to sign in silently with the stored user to sync state
                  await signIn("credentials", {
                    redirect: false,
                    email: parsedUser.email,
                    // No password, just trying to refresh the session
                  });
                } catch (signInError) {
                  console.warn("Silent session refresh failed:", signInError);
                }
              }
            } catch (e) {
              console.error("Failed to parse stored user:", e);
              localStorage.removeItem("user");
            }
          }
        }
      } catch (error) {
        console.error("Error in session handling:", error);
      } finally {
        // Always mark loading as complete
        setIsLoading(false);
      }
    };

    // Only run this effect if session status has changed or is "authenticated"
    if (status !== "loading") {
      handleSessionUpdate();
    }
  }, [session, status, user]);

  // Force a client-side refresh to ensure session state is synchronized
  const forceRefresh = useCallback(async () => {
    console.log("Forcing auth state refresh");
    setIsLoading(true); // Set loading state to true during refresh

    try {
      // Check if we have a valid session
      const currentSession = await getSession();
      console.log(
        "Force refresh session check result:",
        currentSession ? "session found" : "no session found"
      );

      if (currentSession?.user) {
        const userData = {
          id: currentSession.user.id as string,
          name: currentSession.user.name || null,
          email: currentSession.user.email as string,
          role: (currentSession.user as any).role || "CLIENT",
        };

        console.log("Setting user from session during force refresh");
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(userData));

        const cookieValue = `user=${encodeURIComponent(
          JSON.stringify(userData)
        )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict;`;
        document.cookie = cookieValue;

        // Ensure state update is complete before returning
        await new Promise((resolve) => setTimeout(resolve, 10));
        setIsLoading(false);
        return;
      }

      // If no NextAuth session, check for a user cookie as fallback
      const userCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user="));

      if (userCookie) {
        try {
          const cookieValue = userCookie.split("=")[1];
          const userData = JSON.parse(decodeURIComponent(cookieValue));

          if (userData && userData.id) {
            console.log(
              "Using cookie fallback for auth state during force refresh"
            );
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(userData));

            // Ensure state update is complete before returning
            await new Promise((resolve) => setTimeout(resolve, 10));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error(
            "Failed to parse user cookie during force refresh:",
            err
          );
        }
      }

      // If we get here, we have no valid session or cookie
      console.log(
        "No valid auth state found during force refresh, clearing user data"
      );
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      document.cookie =
        "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;";
    } catch (error) {
      console.error("Error during auth refresh:", error);
    } finally {
      setIsLoading(false); // Always ensure loading state is reset
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        resetInactivityTimer,
        forceRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
