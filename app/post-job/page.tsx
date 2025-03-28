"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  useJobForm,
  JobFormStep,
  stepPaths,
} from "@/lib/contexts/job-form-context";

export default function PostJobLanding() {
  const router = useRouter();
  const { setStep, resetForm } = useJobForm();
  const [redirecting, setRedirecting] = useState(false);

  // Redirect to the first step after a longer delay to ensure everything is loaded
  useEffect(() => {
    // Only start the redirection process if we haven't already started it
    if (!redirecting) {
      setRedirecting(true);

      // Increase timeout to 1500ms to ensure context and auth are fully initialized
      const timer = setTimeout(() => {
        try {
          console.log("Redirecting to client-info page...");
          const targetPath = stepPaths[JobFormStep.ClientInfo];

          // Use window.location for more reliable navigation in production
          if (process.env.NODE_ENV === "production") {
            window.location.href = targetPath;
          } else {
            router.push(targetPath);
          }
        } catch (error) {
          console.error("Navigation error:", error);
          // Fallback to direct URL if something goes wrong
          window.location.href = "/post-job/client-info";
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [router, redirecting]);

  const handleStartNew = () => {
    resetForm();
    setStep(JobFormStep.ClientInfo);

    try {
      router.push(stepPaths[JobFormStep.ClientInfo]);
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = "/post-job/client-info";
    }
  };

  const handleContinue = () => {
    setStep(JobFormStep.ClientInfo);

    try {
      router.push(stepPaths[JobFormStep.ClientInfo]);
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = "/post-job/client-info";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 text-center">
      <h1 className="text-3xl font-bold">Post a Painting Job</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        Find the perfect painter for your project by creating a detailed job
        posting.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleStartNew} size="lg">
          Start New Job
        </Button>
        <Button onClick={handleContinue} variant="outline" size="lg">
          Continue Draft
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Starting your job posting in a moment...
      </p>
    </div>
  );
}
