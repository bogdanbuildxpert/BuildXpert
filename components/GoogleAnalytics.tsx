"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
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
  const [shouldLoadGA, setShouldLoadGA] = useState(false);

  useEffect(() => {
    // Only load Google Analytics if user has consented to analytics cookies
    if (cookiePreferences?.hasConsented && cookiePreferences?.analytics) {
      setShouldLoadGA(true);
    } else {
      // If consent is revoked, attempt to disable existing GA
      if (typeof window !== "undefined" && window.gtag) {
        // Disable Google Analytics tracking
        window.gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
      setShouldLoadGA(false);
    }
  }, [cookiePreferences]);

  if (!shouldLoadGA) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
            'anonymize_ip': true
          });
          gtag('consent', 'update', {
            'analytics_storage': 'granted'
          });
        `}
      </Script>
    </>
  );
}
