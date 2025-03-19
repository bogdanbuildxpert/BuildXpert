"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AdminJobList } from "@/components/AdminJobList";
import { ClientJobList } from "@/components/ClientJobList";
import { Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/jobs");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container py-16 md:py-24">
        <div className="space-y-12 fade-in">
          <div className="space-y-4">
            <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-full max-w-3xl bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-96 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (prevents flash of content before redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-12 fade-in">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            {user.role !== "ADMIN" ? "Manage Your Jobs" : "Available Jobs"}
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            {user.role !== "ADMIN"
              ? "Create, edit, and manage your job postings to find qualified professionals for your projects."
              : "Browse through our current job listings or post your own job to find professional services for your construction project."}
          </p>
        </div>

        {user.role === "ADMIN" ? (
          // Admin view - can see all jobs
          <AdminJobList />
        ) : (
          // Client view - can only see and manage their own jobs
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">My Jobs</h2>
            </div>
            <ClientJobList userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
