"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics-helper";

export function usePageAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // Create the full URL with query parameters
      let url = pathname;
      if (searchParams?.toString()) {
        url = `${pathname}?${searchParams.toString()}`;
      }

      // Track the page view
      trackPageView(url);
    }
  }, [pathname, searchParams]);
}
