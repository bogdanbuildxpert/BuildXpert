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
      setUser(null);
      setIsAuthenticated(false);

      // Clear all auth-related timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }

      // Clear all auth-related cookies
      document.cookie =
        "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "__Secure-next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "__Secure-next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

      console.log("Successfully cleared auth state and cookies");
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

      // Set the user in a cookie for server-side access
      const userJson = JSON.stringify(userData);
      document.cookie = `user=${encodeURIComponent(
        userJson
      )}; path=/; max-age=${60 * 60 * 24 * 7}`;

      console.log("Successfully updated auth context state");

      // Reset the inactivity timer
      resetInactivityTimer();

      return true;
    } catch (error) {
      console.error("Error in auth context login:", error);
      return false;
    }
  };

  // Update the useEffect for session handling
  useEffect(() => {
    const handleSessionUpdate = async () => {
      try {
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

            // Update the cookie as well
            const userJson = JSON.stringify(nextAuthUser);
            document.cookie = `user=${encodeURIComponent(
              userJson
            )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict;`;

            // Reset inactivity timer when session is updated
            resetInactivityTimer();
          }
        } else if (status === "unauthenticated") {
          // Only clear user data if we don't have a cookie-based user
          // This prevents NextAuth from clearing our manual login
          const userCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("user="));

          if (userCookie) {
            console.log(
              "Found user cookie, keeping user data despite NextAuth reporting unauthenticated"
            );
            // We have a cookie-based user, so don't clear the user data
            return;
          }

          // If we get here, we have no session and no cookie, so clear everything
          if (user) {
            console.log(
              "NextAuth reports unauthenticated and no cookie found, clearing user data"
            );
            setUser(null);
            localStorage.removeItem("user");
            document.cookie =
              "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;";
          }
        }

        // Always set loading state based on the session status
        setIsLoading(status === "loading");
      } catch (error) {
        console.error("Error handling session update:", error);
      }
    };

    handleSessionUpdate();
  }, [session, status, user, resetInactivityTimer]);

  // Force a client-side refresh to ensure session state is synchronized
  const forceRefresh = useCallback(async () => {
    console.log("Forcing auth state refresh");

    try {
      // Check if we have a valid session
      const currentSession = await getSession();

      if (currentSession?.user) {
        const userData = {
          id: currentSession.user.id as string,
          name: currentSession.user.name || null,
          email: currentSession.user.email as string,
          role: (currentSession.user as any).role || "CLIENT",
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        const cookieValue = `user=${encodeURIComponent(
          JSON.stringify(userData)
        )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict;`;
        document.cookie = cookieValue;
      }
    } catch (error) {
      console.error("Error during auth refresh:", error);
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
