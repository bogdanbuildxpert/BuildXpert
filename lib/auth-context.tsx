"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
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
          logout();
        }
      }, INACTIVITY_TIMEOUT);
    }
  };

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
  }, [user]); // Re-run when user changes

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
      setUser(nextAuthUser);

      // Also update localStorage for backward compatibility
      localStorage.setItem("user", JSON.stringify(nextAuthUser));
    }

    setIsLoading(status === "loading");
  }, [session, status]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Also set the user in a cookie for server-side access
    document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${
      60 * 60 * 24 * 7
    }`; // 7 days

    // Reset inactivity timer on login
    resetInactivityTimer();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");

    // Also clear the user cookie
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

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

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, resetInactivityTimer }}
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
