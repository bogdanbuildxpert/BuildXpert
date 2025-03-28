"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");

  useEffect(() => {
    // If there's no job ID, redirect to the jobs page after 5 seconds
    if (!jobId) {
      const timer = setTimeout(() => {
        router.push("/jobs");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [jobId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center">
      <CheckCircle2 className="text-green-500 h-16 w-16" />
      <h1 className="text-2xl font-bold">Job Posted Successfully!</h1>
      <p className="text-muted-foreground max-w-md">
        Your job has been posted and is now visible to painters. You'll be
        notified when you receive bids.
      </p>
      <div className="space-y-4">
        {jobId ? (
          <Button onClick={() => router.push(`/jobs/${jobId}`)}>
            View Job Posting
          </Button>
        ) : (
          <Button onClick={() => router.push("/jobs")}>View All Jobs</Button>
        )}
        <div>
          <Button variant="outline" onClick={() => router.push("/post-job")}>
            Post Another Job
          </Button>
        </div>
      </div>
    </div>
  );
}
