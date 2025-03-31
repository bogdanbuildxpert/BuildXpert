"use client";

import { useEffect } from "react";
import { useCookiePreferences } from "@/lib/hooks/use-cookie-preferences";

// Define the global gtag function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function GoogleAnalytics() {
  const { cookiePreferences } = useCookiePreferences();

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;

    // Set analytics consent based on cookie preferences
    if (cookiePreferences?.hasConsented && cookiePreferences?.analytics) {
      // User has consented to analytics, enable tracking
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    } else {
      // User has not consented to analytics, disable tracking
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  }, [cookiePreferences]);

  // No longer need to render script tags, as they're now in layout.tsx
  return null;
}
