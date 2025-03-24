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

// Helper function to get cookie preferences from browser cookies
const getCookiePreferences = (): CookiePreferences | null => {
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
          return defaultPreferences;
        }
        const preferences = JSON.parse(cookieValue) as CookiePreferences;
        // Validate the structure of the preferences
        if (typeof preferences !== "object" || preferences === null) {
          console.warn("Invalid preferences structure, resetting to default");
          return defaultPreferences;
        }
        // Ensure essential cookies are always true
        preferences.essential = true;
        // Ensure hasConsented is included
        preferences.hasConsented = true;
        return preferences;
      } catch (parseError) {
        console.error("Error parsing cookie value:", parseError);
        return defaultPreferences;
      }
    }
  } catch (error) {
    console.error("Error reading cookie preferences:", error);
  }
  return null;
};

// Helper function to set cookie preferences in browser cookies
const setCookiePreferences = (preferences: CookiePreferences) => {
  try {
    // Ensure essential cookies are always true
    preferences.essential = true;
    // Ensure hasConsented is included
    preferences.hasConsented = true;

    // Properly encode the cookie value
    const cookieValue = encodeURIComponent(JSON.stringify(preferences));

    document.cookie = `${COOKIE_CONSENT_KEY}=${cookieValue}; path=/; max-age=${
      60 * 60 * 24 * 365 // 1 year
    }; ${process.env.NODE_ENV === "production" ? "secure; " : ""}samesite=lax`;
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

  // Load cookie preferences on mount and when user changes
  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        // First check browser cookies
        const storedPreferences = getCookiePreferences();
        if (storedPreferences && isMounted) {
          setPreferences(storedPreferences);
          setHasConsented(!!storedPreferences.hasConsented);
          setIsLoading(false);

          // If user is logged in, sync cookie preferences to database
          if (user) {
            try {
              await fetch("/api/user/cookie-preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cookiePreferences: storedPreferences }),
              });
            } catch (error) {
              console.error(
                "Error syncing cookie preferences to database:",
                error
              );
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
            });

            if (response.ok) {
              const data = await response.json();
              const dbPreferences =
                data.cookiePreferences || defaultPreferences;
              if (isMounted) {
                setPreferences(dbPreferences);
                setHasConsented(true);
                // Sync database preferences to cookies
                setCookiePreferences(dbPreferences);
              }
            }
          } catch (error) {
            console.error(
              "Error loading cookie preferences from database:",
              error
            );
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in loadPreferences:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const updateCookiePreferences = async (
    newPreferences: Partial<CookiePreferences>
  ) => {
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
        });

        if (response.ok) {
          toast.success("Cookie preferences updated successfully");
          return true;
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to update cookie preferences");
          return false;
        }
      } else {
        toast.success("Cookie preferences updated successfully");
        return true;
      }
    } catch (error) {
      console.error("Error updating cookie preferences:", error);
      toast.error("Failed to update cookie preferences");
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
