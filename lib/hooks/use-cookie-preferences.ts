import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  hasConsented?: boolean;
}

const COOKIE_CONSENT_KEY = "cookie-consent";

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: true,
  preferences: true,
  hasConsented: false,
};

// Check if running in browser environment
const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

// Helper function to get cookie preferences from browser cookies
const getCookiePreferences = (): CookiePreferences | null => {
  if (!isBrowser) return null;

  try {
    const storedPreferences = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_CONSENT_KEY}=`));

    if (storedPreferences) {
      try {
        const cookieValue = decodeURIComponent(storedPreferences.split("=")[1]);
        // Validate that the cookie value starts with { and ends with }
        if (!cookieValue.startsWith("{") || !cookieValue.endsWith("}")) {
          console.warn(
            "Invalid cookie format, resetting to default preferences"
          );
          return null;
        }
        const preferences = JSON.parse(cookieValue) as CookiePreferences;
        // Validate the structure of the preferences
        if (typeof preferences !== "object" || preferences === null) {
          console.warn("Invalid preferences structure, resetting to default");
          return null;
        }
        // Ensure essential cookies are always true
        preferences.essential = true;
        // Ensure hasConsented is included
        preferences.hasConsented = true;
        return preferences;
      } catch (parseError) {
        console.error("Error parsing cookie value:", parseError);
        return null;
      }
    }
  } catch (error) {
    console.error("Error reading cookie preferences:", error);
  }
  return null;
};

// Helper function to set cookie preferences in browser cookies
const setCookiePreferences = (preferences: CookiePreferences) => {
  if (!isBrowser) return;

  try {
    // Ensure essential cookies are always true
    preferences.essential = true;
    // Ensure hasConsented is included and set to true when explicitly saving preferences
    preferences.hasConsented = true;

    // Properly encode the cookie value
    const cookieValue = encodeURIComponent(JSON.stringify(preferences));

    // Set cookie with proper flags
    const cookieString = [
      `${COOKIE_CONSENT_KEY}=${cookieValue}`,
      "path=/",
      `max-age=${60 * 60 * 24 * 365}`, // 1 year
      "samesite=lax",
      process.env.NODE_ENV === "production" ? "secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    document.cookie = cookieString;
  } catch (error) {
    console.error("Error setting cookie preferences:", error);
  }
};

export function useCookiePreferences() {
  const { user } = useAuth();
  const [cookiePreferences, setPreferences] =
    useState<CookiePreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);

  // Initialize preferences from cookies - only runs in browser
  useEffect(() => {
    if (isBrowser) {
      // Try to get stored preferences on initial mount
      const stored = getCookiePreferences();
      if (stored) {
        setPreferences(stored);
        setHasConsented(stored?.hasConsented || false);
      }
    }
  }, []);

  // Load cookie preferences on mount and when user changes
  useEffect(() => {
    if (!isBrowser) return;

    let isMounted = true;
    let abortController = new AbortController();

    const loadPreferences = async () => {
      try {
        // First check browser cookies
        const storedPreferences = getCookiePreferences();
        if (storedPreferences && isMounted) {
          setPreferences(storedPreferences);
          setHasConsented(true); // If we have stored preferences, user has consented
          setIsLoading(false);

          // If user is logged in, sync cookie preferences to database
          if (user && isMounted) {
            try {
              await fetch("/api/user/cookie-preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cookiePreferences: storedPreferences }),
                signal: abortController.signal,
              });
            } catch (error) {
              if (!abortController.signal.aborted) {
                console.error(
                  "Error syncing cookie preferences to database:",
                  error
                );
              }
            }
          }
          return;
        }

        // If no cookie preferences found and user is logged in, try to load from database
        if (user && isMounted) {
          try {
            const response = await fetch("/api/user/cookie-preferences", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal: abortController.signal,
            });

            if (response.ok && isMounted) {
              const data = await response.json();
              const dbPreferences =
                data.cookiePreferences || defaultPreferences;
              dbPreferences.hasConsented = true; // Ensure consent is set for DB preferences

              setPreferences(dbPreferences);
              setHasConsented(true);
              // Sync database preferences to cookies
              setCookiePreferences(dbPreferences);
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error(
                "Error loading cookie preferences from database:",
                error
              );
            }
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error in loadPreferences:", error);
          setIsLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user]);

  const updateCookiePreferences = async (
    newPreferences: Partial<CookiePreferences>
  ) => {
    if (!isBrowser) return false;

    const abortController = new AbortController();

    try {
      const updatedPreferences = {
        ...cookiePreferences,
        ...newPreferences,
        essential: true, // Essential cookies cannot be disabled
        hasConsented: true, // Mark as consented when preferences are updated
      };

      // Always update browser cookies
      setCookiePreferences(updatedPreferences);
      setPreferences(updatedPreferences);
      setHasConsented(true);

      // If user is logged in, also update database
      if (user) {
        const response = await fetch("/api/user/cookie-preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cookiePreferences: updatedPreferences,
          }),
          signal: abortController.signal,
        });

        if (response.ok) {
          toast.success("Cookie preferences updated successfully", {
            closeButton: true,
          });
          return true;
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to update cookie preferences", {
            closeButton: true,
          });
          return false;
        }
      } else {
        toast.success("Cookie preferences updated successfully", {
          closeButton: true,
        });
        return true;
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error("Error updating cookie preferences:", error);
        toast.error("Failed to update cookie preferences", {
          closeButton: true,
        });
      }
      return false;
    }
  };

  return {
    cookiePreferences,
    updateCookiePreferences,
    isLoading,
    hasConsented,
  };
}
