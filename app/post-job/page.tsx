"use client";

import { useEffect } from "react";
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

  // Redirect to the first step after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(stepPaths[JobFormStep.ClientInfo]);
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  const handleStartNew = () => {
    resetForm();
    setStep(JobFormStep.ClientInfo);
  };

  const handleContinue = () => {
    setStep(JobFormStep.ClientInfo);
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
