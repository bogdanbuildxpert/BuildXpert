"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Edit, Trash2, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistance } from "date-fns";

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

interface ClientJobListProps {
  userId: string;
}

export function ClientJobList({ userId }: ClientJobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/jobs/user?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load your jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchJobs();
    }
  }, [userId, fetchJobs]);

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      const response = await fetch(`/api/jobs/${jobToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 401) {
          toast.error("You need to be logged in to delete this job");
          return;
        }

        if (response.status === 403) {
          toast.error("You don't have permission to delete this job");
          return;
        }

        throw new Error(errorData.error || "Failed to delete job");
      }

      // Remove the deleted job from the state
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobToDelete));
      toast.success("Job deleted successfully");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete job"
      );
    } finally {
      setJobToDelete(null);
    }
  };

  // Filter jobs based on search query and status filter
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
              placeholder="Search your jobs..."
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
        <Button asChild>
          <Link href="/post-job">
            <Plus className="h-4 w-4 mr-2" />
            Post a New Job
          </Link>
        </Button>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <h3 className="text-lg font-medium">
            {jobs.length === 0
              ? "You haven't posted any jobs yet"
              : "No jobs match your search criteria"}
          </h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {jobs.length === 0
              ? "Create your first job posting to find qualified professionals."
              : "Try adjusting your search or filter settings."}
          </p>
          {jobs.length === 0 && (
            <Button asChild>
              <Link href="/post-job">
                <Plus className="h-4 w-4 mr-2" />
                Post a Job
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden transition-all hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
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
                <div className="space-y-2 mb-4">
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
                <div className="flex justify-between pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-primary hover:text-primary hover:bg-primary/5"
                  >
                    <Link href={`/jobs/${job.id}`}>View Details</Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      className="hover:bg-primary/5 hover:text-primary hover:border-primary/50"
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
                          size="icon"
                          onClick={() => setJobToDelete(job.id)}
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this job posting?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setJobToDelete(null)}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteJob}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 w-full md:w-96" />
          <Skeleton className="h-10 w-full md:w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(3)
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="flex justify-between pt-4 border-t border-border">
                  <Skeleton className="h-9 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
