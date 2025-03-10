"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  createdAt: string;
  poster: {
    id: string;
    name: string | null;
    email: string;
  };
  messageCount: number;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (
      !authLoading &&
      (!user || (user.role !== "ADMIN" && user.role !== "admin"))
    ) {
      toast.error("You don't have permission to access this page");
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch jobs with messages
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user || (user.role !== "ADMIN" && user.role !== "admin")) return;

      try {
        setIsLoading(true);

        // Fetch all jobs
        const jobsResponse = await fetch("/api/jobs");
        if (!jobsResponse.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const jobsData = await jobsResponse.json();

        // For each job, fetch message count
        const jobsWithMessages = await Promise.all(
          jobsData.map(async (job: any) => {
            const messagesResponse = await fetch(
              `/api/messages?jobId=${job.id}`
            );
            if (!messagesResponse.ok) {
              return { ...job, messageCount: 0 };
            }
            const messagesData = await messagesResponse.json();
            return { ...job, messageCount: messagesData.length };
          })
        );

        // Filter jobs with messages
        const filteredJobs = jobsWithMessages.filter(
          (job: Job) => job.messageCount > 0
        );

        setJobs(filteredJobs);
      } catch (error) {
        console.error("Error fetching jobs with messages:", error);
        toast.error("Failed to load jobs with messages");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchJobs();
    }
  }, [user, authLoading]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-16 md:py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-8 fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Job Messages</h1>
            <p className="text-muted-foreground">
              View and manage all job conversations
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <h3 className="text-lg font-medium">No job conversations found</h3>
            <p className="text-muted-foreground mt-2">
              There are no active conversations for any jobs at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block p-6 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{job.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      job.status === "OPEN"
                        ? "bg-green-100 text-green-800"
                        : job.status === "FILLED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {job.description}
                </p>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Posted: {formatDate(job.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{job.messageCount} messages</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
