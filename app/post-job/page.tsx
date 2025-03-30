"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useJobForm,
  JobFormStep,
  stepPaths,
} from "@/lib/contexts/job-form-context";
import { useAuth } from "@/lib/auth-context";

export default function PostJobLanding() {
  const router = useRouter();
  const { setStep } = useJobForm();
  const { user } = useAuth();

  // Immediately redirect to the first step
  useEffect(() => {
    // If we're already rendering this page, we can safely continue with the redirect
    // This helps avoid middleware/auth redirection conflicts
    console.log(
      "Post job landing page - initiating direct client-info navigation"
    );

    const targetPath = stepPaths[JobFormStep.ClientInfo];
    setStep(JobFormStep.ClientInfo);

    // Use window.location.replace for immediate redirection
    // This is more direct than router.push and ensures we go straight to client-info
    window.location.replace(targetPath);
  }, [setStep]);

  // Return a minimal loading placeholder that won't trigger other redirects
  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-muted-foreground">Redirecting to job form...</p>
    </div>
  );
}
