"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
}

// Create a default context value to avoid null checks
const defaultContextValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  logout: async () => {},
  resetInactivityTimer: () => {},
};

// 5 hours in milliseconds
const INACTIVITY_TIMEOUT = 5 * 60 * 60 * 1000;
// Warning 5 minutes before logout
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000;

const AuthContext = createContext<AuthContextType>(defaultContextValue);

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
  const logout = useCallback(async () => {
    try {
      console.log("Logging out user");

      // Clear React state first
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

      // Call NextAuth signOut with explicit redirect
      await signOut({
        redirect: true,
        callbackUrl: `/login?t=${Date.now()}`,
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, redirect to login
      window.location.href = `/login?from=error&t=${Date.now()}`;
    }
  }, []);

  // Keep logout reference updated
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

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
  }, [user]);

  // Set up event listeners for user activity
  useEffect(() => {
    if (typeof window === "undefined") return;

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
  }, [resetInactivityTimer]);

  // Sync session with local state
  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("Session status:", status);

    if (status === "loading") {
      // Keep previous state during loading
      return;
    }

    // Add a last session check timestamp to prevent loops
    const now = Date.now();
    const lastCheck = window.sessionStorage.getItem("last_session_check");
    const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0;

    // Only process this effect if more than 1 second has passed since last check
    // This prevents rapid re-renders from causing excessive session checks
    if (now - lastCheckTime < 1000) {
      return;
    }

    // Update the last check time
    window.sessionStorage.setItem("last_session_check", now.toString());

    if (status === "authenticated" && session?.user) {
      const userData: User = {
        id: (session.user as any).id || (session.user as any).sub || "",
        name: session.user.name || null,
        email: session.user.email || "",
        role: (session.user as any).role || "USER",
      };

      // Call the auth check endpoint to set the user-role cookie for admin routes
      fetch("/api/auth/check", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, max-age=0",
        },
      }).catch((err) => {
        console.warn("Failed to check auth status:", err);
      });

      setUser(userData);
      setIsAuthenticated(true);
      resetInactivityTimer();
      console.log("User authenticated with data:", userData);
    } else {
      // Clear user data when not authenticated
      setUser(null);
      setIsAuthenticated(false);
      console.log("User not authenticated, cleared user state");
    }

    setIsLoading(false);
  }, [session, status, resetInactivityTimer]);

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    logout,
    resetInactivityTimer,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
