"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Trash2, Edit, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistance } from "date-fns";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  poster: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function AdminJobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/jobs");
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDeleteJob = async (jobId: string) => {
    try {
      setIsDeleting(true);
      setJobToDelete(jobId);

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete job");
      }

      // Success - remove job from list
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      toast.success("Job deleted successfully");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete job"
      );
    } finally {
      setIsDeleting(false);
      setJobToDelete(null);
    }
  };

  const handleDeleteAllJobs = async () => {
    try {
      setIsDeletingAll(true);

      const response = await fetch("/api/jobs/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleteAll: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete jobs");
      }

      const result = await response.json();

      // Clear the jobs list
      setJobs([]);
      toast.success(result.message || `Successfully deleted all jobs`);
    } catch (error) {
      console.error("Error deleting all jobs:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete jobs"
      );
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (statusFilter === "all" || job.status === statusFilter)
  );

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (isLoading) {
    return <JobListSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Status</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Jobs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                  Delete All Jobs
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete ALL jobs and their associated
                  messages. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllJobs}
                  disabled={isDeletingAll}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeletingAll ? (
                    <>
                      <span className="animate-pulse">Deleting...</span>
                    </>
                  ) : (
                    <>I understand, delete everything</>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild>
            <Link href="/post-job">Post a Job</Link>
          </Button>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No jobs found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search or post a new job.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      job.status === "PLANNING"
                        ? "bg-green-100 text-green-800"
                        : job.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : job.status === "ON_HOLD"
                        ? "bg-yellow-100 text-yellow-800"
                        : job.status === "COMPLETED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {job.status === "PLANNING"
                      ? "Planning"
                      : job.status === "IN_PROGRESS"
                      ? "In Progress"
                      : job.status === "ON_HOLD"
                      ? "On Hold"
                      : job.status === "COMPLETED"
                      ? "Completed"
                      : "Cancelled"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {job.description}
                </p>
                <div className="mt-auto pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>
                        Posted{" "}
                        {formatDistance(new Date(job.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-primary"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 text-primary"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span className="truncate max-w-[120px]">
                        {job.poster.name || job.poster.email.split("@")[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 rounded-full"
                    asChild
                  >
                    <Link href={`/jobs/${job.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 rounded-full"
                    asChild
                  >
                    <Link href={`/jobs/edit/${job.id}`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 rounded-full text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this job? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={isDeleting && jobToDelete === job.id}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting && jobToDelete === job.id
                            ? "Deleting..."
                            : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JobListSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <Skeleton className="h-10 w-full md:w-96" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
