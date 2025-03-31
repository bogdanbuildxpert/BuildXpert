/**
 * Helper functions for Google Analytics integration with cookie consent
 */

const COOKIE_CONSENT_KEY = "cookie-consent";

// Check if analytics consent has been given
export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const storedPreferences = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_CONSENT_KEY}=`));

    if (storedPreferences) {
      const cookieValue = decodeURIComponent(storedPreferences.split("=")[1]);
      if (cookieValue.startsWith("{") && cookieValue.endsWith("}")) {
        const preferences = JSON.parse(cookieValue);
        return (
          preferences.hasConsented === true && preferences.analytics === true
        );
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking analytics consent:", error);
    return false;
  }
};

// Track a custom event if consent has been given
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (typeof window === "undefined" || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  try {
    window.gtag("event", eventName, eventParams);
  } catch (error) {
    console.error(`Error tracking event "${eventName}":`, error);
  }
};

// Track a page view if consent has been given
export const trackPageView = (url: string): void => {
  if (typeof window === "undefined" || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  try {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string, {
      page_path: url,
    });
  } catch (error) {
    console.error(`Error tracking page view for "${url}":`, error);
  }
};
