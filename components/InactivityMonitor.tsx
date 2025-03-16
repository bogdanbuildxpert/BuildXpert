"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function InactivityMonitor() {
  const { resetInactivityTimer, user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset the inactivity timer when the route changes
  useEffect(() => {
    if (user) {
      resetInactivityTimer();
    }
  }, [pathname, searchParams, resetInactivityTimer, user]);

  // This component doesn't render anything
  return null;
}
