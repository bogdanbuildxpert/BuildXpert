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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
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
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const logoutRef = useRef<() => void>(() => {});

  // The logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");

    // Clear the user cookie with proper attributes
    document.cookie =
      "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;";

    // Sign out from NextAuth
    signOut({ redirect: false });

    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
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

  useEffect(() => {
    // Check if user is stored in localStorage as a fallback
    const storedUser = localStorage.getItem("user");
    if (storedUser && !session) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
      }
    }

    // If we have a session from NextAuth, use that
    if (session && session.user) {
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
      }
    } else if (status === "unauthenticated" && user) {
      // If NextAuth says we're not authenticated but we have a user, clear it
      console.log("NextAuth reports unauthenticated, clearing user data");
      setUser(null);
      localStorage.removeItem("user");
      document.cookie =
        "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict;";
    }

    // Always set loading state based on the session status
    setIsLoading(status === "loading");
  }, [session, status, user]);

  const login = (userData: User) => {
    console.log("Setting user data in auth context:", userData);
    setUser(userData);

    // Update local storage
    localStorage.setItem("user", JSON.stringify(userData));

    // Set the user in a cookie for server-side access with better security
    const userJson = JSON.stringify(userData);
    const cookieValue = `user=${encodeURIComponent(
      userJson
    )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict;`;

    console.log("Setting user cookie:", cookieValue.substring(0, 50) + "...");
    document.cookie = cookieValue;

    // Reset inactivity timer on login
    resetInactivityTimer();
  };

  // Force a client-side refresh to ensure session state is synchronized
  const forceRefresh = useCallback(() => {
    console.log("Forcing auth state refresh");

    // Check if we have a user in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Re-set the user cookie to ensure it's properly set
        const cookieValue = `user=${encodeURIComponent(
          storedUser
        )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict;`;
        document.cookie = cookieValue;

        // Update state if needed
        if (!user || user.id !== userData.id) {
          setUser(userData);
        }
      } catch (error) {
        console.error(
          "Failed to parse user from localStorage during refresh:",
          error
        );
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
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
