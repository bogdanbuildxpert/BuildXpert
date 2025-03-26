"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page with register tab selected
    router.replace("/login?tab=register");
  }, [router]);

  return (
    <div className="container max-w-md py-16 md:py-24 text-center">
      Redirecting to sign up...
    </div>
  );
}
