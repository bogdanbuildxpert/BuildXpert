"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function InactivityMonitor() {
  const auth = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);

  // Safe initialization to detect client-side mounting
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Reset the inactivity timer when the route changes
  useEffect(() => {
    // Only run on client side and if component is mounted
    if (!isMounted) return;

    // Only run if auth is available and user is logged in
    if (auth?.user && typeof auth.resetInactivityTimer === "function") {
      try {
        auth.resetInactivityTimer();
      } catch (error) {
        console.error("Error resetting inactivity timer:", error);
      }
    }
  }, [pathname, searchParams, auth, isMounted]);

  // This component doesn't render anything
  return null;
}
