import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: true,
  preferences: true,
};

export function useCookiePreferences() {
  const { user } = useAuth();
  const [cookiePreferences, setCookiePreferences] =
    useState<CookiePreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load cookie preferences from the database when the user is logged in
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/cookie-preferences", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCookiePreferences(data.cookiePreferences || defaultPreferences);
        } else {
          console.error("Failed to load cookie preferences");
        }
      } catch (error) {
        console.error("Error loading cookie preferences:", error);
      } finally {
        setIsLoading(false);
      }
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
        setCookiePreferences(updatedPreferences);
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
  };

  return {
    cookiePreferences,
    updateCookiePreferences,
    isLoading,
  };
}
