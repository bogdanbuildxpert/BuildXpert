import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = "cookie-consent";

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: true,
  preferences: true,
};

// Helper function to get cookie preferences from browser cookies
const getCookiePreferences = (): CookiePreferences | null => {
  try {
    const storedPreferences = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_CONSENT_KEY}=`));

    if (storedPreferences) {
      const preferences = JSON.parse(
        storedPreferences.split("=")[1]
      ) as CookiePreferences;
      // Ensure essential cookies are always true
      preferences.essential = true;
      return preferences;
    }
  } catch (error) {
    console.error("Error parsing cookie preferences:", error);
  }
  return null;
};

// Helper function to set cookie preferences in browser cookies
const setCookiePreferences = (preferences: CookiePreferences) => {
  const cookieValue = JSON.stringify(preferences);
  document.cookie = `${COOKIE_CONSENT_KEY}=${cookieValue}; path=/; max-age=${
    60 * 60 * 24 * 365 // 1 year
  }; ${process.env.NODE_ENV === "production" ? "secure; " : ""}samesite=lax`;
};

export function useCookiePreferences() {
  const { user } = useAuth();
  const [cookiePreferences, setPreferences] =
    useState<CookiePreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);

  // Load cookie preferences on mount and when user changes
  useEffect(() => {
    const loadPreferences = async () => {
      // First check browser cookies
      const storedPreferences = getCookiePreferences();
      if (storedPreferences) {
        setPreferences(storedPreferences);
        setHasConsented(true);
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
      if (user) {
        try {
          const response = await fetch("/api/user/cookie-preferences", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            const data = await response.json();
            const dbPreferences = data.cookiePreferences || defaultPreferences;
            setPreferences(dbPreferences);
            setHasConsented(true);
            // Sync database preferences to cookies
            setCookiePreferences(dbPreferences);
          }
        } catch (error) {
          console.error(
            "Error loading cookie preferences from database:",
            error
          );
        }
      }

      setIsLoading(false);
    };

    loadPreferences();
  }, [user]);

  const updateCookiePreferences = async (
    newPreferences: Partial<CookiePreferences>
  ) => {
    const updatedPreferences = {
      ...cookiePreferences,
      ...newPreferences,
      essential: true, // Essential cookies cannot be disabled
    };

    // Always update browser cookies
    setCookiePreferences(updatedPreferences);
    setPreferences(updatedPreferences);
    setHasConsented(true);

    // If user is logged in, also update database
    if (user) {
      try {
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
      } catch (error) {
        console.error("Error updating cookie preferences:", error);
        toast.error("Failed to update cookie preferences");
        return false;
      }
    }

    toast.success("Cookie preferences updated successfully");
    return true;
  };

  return {
    cookiePreferences,
    updateCookiePreferences,
    isLoading,
    hasConsented,
  };
}
