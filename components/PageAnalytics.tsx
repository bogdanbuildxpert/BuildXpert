"use client";

import { usePageAnalytics } from "@/hooks/usePageAnalytics";

export function PageAnalytics() {
  // Use the hook to track page views
  usePageAnalytics();

  // This component doesn't render anything
  return null;
}
