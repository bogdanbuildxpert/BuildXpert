"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { SimpleJobChat } from "@/components/SimpleJobChat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    role: string;
  };
  metadata?: {
    propertyType?: string;
    paintingAreas?: string[];
    surfaceCondition?: string;
    paintType?: string;
    colorPreferences?: string;
    specialFinishes?: string;
    estimatedArea?: number;
    startDate?: string;
    endDate?: string;
    furnitureMoving?: boolean;
    scaffolding?: boolean;
    additionalNotes?: string;
    images?: string[];
  };
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/jobs/${params.id}`);
    }
  }, [user, authLoading, router, params.id]);

  // Fetch job data
  const fetchJob = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/jobs/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch job");
      }

      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
      router.push("/jobs");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  // Initial data fetch
  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Function to open image in modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Function to close image modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Add function to update job status
  const updateJobStatus = async (newStatus: string) => {
    if (!job || !user || user.role !== "ADMIN") return;

    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...job,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job status");
      }

      // Update local state
      setJob((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success("Job status updated successfully");
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update job status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Don't render anything if user is not authenticated (prevents flash of content before redirect)
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container py-16 md:py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-16 md:py-24">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Job Not Found</h1>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if the current user is the job poster
  const isJobPoster = user && user.id === job.poster.id;
  const isAdmin = user && (user.role === "ADMIN" || user.role === "admin");

  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-12 fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            {(isJobPoster || isAdmin) && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/jobs/edit/${job.id}`}>Edit Job</Link>
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              Posted on {formatDate(job.createdAt)} by{" "}
              {job.poster.name || job.poster.email.split("@")[0]}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Job Header Card */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold">{job.title}</h1>
                  {isAdmin ? (
                    <div className="relative">
                      <Select
                        value={job.status}
                        onValueChange={updateJobStatus}
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger
                          className={`h-7 px-3 text-xs font-medium rounded-full border-0 ${
                            job.status === "PLANNING"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : job.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : job.status === "ON_HOLD"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : job.status === "COMPLETED"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          <SelectValue>
                            {isUpdatingStatus ? (
                              <div className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Updating...
                              </div>
                            ) : job.status === "PLANNING" ? (
                              "Planning"
                            ) : job.status === "IN_PROGRESS" ? (
                              "In Progress"
                            ) : job.status === "ON_HOLD" ? (
                              "On Hold"
                            ) : job.status === "COMPLETED" ? (
                              "Completed"
                            ) : (
                              "Cancelled"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLANNING">Planning</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            In Progress
                          </SelectItem>
                          <SelectItem value="ON_HOLD">On Hold</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
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
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Card */}
            {job.metadata && (
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <div className="border-b px-6 py-4">
                  <h2 className="text-xl font-semibold">Job Details</h2>
                </div>
                <div className="p-6">
                  {/* Image Gallery */}
                  {job.metadata.images && job.metadata.images.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-foreground mb-3">
                        Site Photos
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {job.metadata.images.map(
                          (image: string, index: number) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-md overflow-hidden border border-border cursor-pointer transition-all hover:opacity-90 hover:shadow-md"
                              onClick={() => openImageModal(image)}
                            >
                              <img
                                src={image}
                                alt={`Site photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="text-white opacity-0 hover:opacity-100 font-medium">
                                  View
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {job.metadata.propertyType && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Property Type
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {job.metadata.propertyType}
                        </p>
                      </div>
                    )}
                    {job.metadata.paintingAreas &&
                      job.metadata.paintingAreas.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-foreground">
                            Areas to be Painted
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 capitalize">
                            {job.metadata.paintingAreas.join(", ")}
                          </p>
                        </div>
                      )}
                    {job.metadata.surfaceCondition && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Surface Condition
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.metadata.surfaceCondition}
                        </p>
                      </div>
                    )}
                    {job.metadata.paintType && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Paint Type
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {job.metadata.paintType}
                        </p>
                      </div>
                    )}
                    {job.metadata.colorPreferences && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Color Preferences
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.metadata.colorPreferences}
                        </p>
                      </div>
                    )}
                    {job.metadata.specialFinishes && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Special Finishes
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.metadata.specialFinishes}
                        </p>
                      </div>
                    )}
                    {job.metadata.estimatedArea && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Estimated Area
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.metadata.estimatedArea} sq meters
                        </p>
                      </div>
                    )}
                    {(job.metadata.startDate || job.metadata.endDate) && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Timeline
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.metadata.startDate
                            ? new Date(
                                job.metadata.startDate
                              ).toLocaleDateString()
                            : "Not specified"}
                          {" to "}
                          {job.metadata.endDate
                            ? new Date(
                                job.metadata.endDate
                              ).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>
                    )}
                    {(job.metadata.furnitureMoving ||
                      job.metadata.scaffolding) && (
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          Additional Requirements
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.metadata.furnitureMoving
                            ? "Furniture moving/protection needed. "
                            : ""}
                          {job.metadata.scaffolding
                            ? "Scaffolding required. "
                            : ""}
                        </p>
                      </div>
                    )}
                    {job.metadata.additionalNotes && (
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-foreground">
                          Additional Notes
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.metadata.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="border-b px-6 py-4">
                <h2 className="text-xl font-semibold">About the Client</h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <p className="font-medium">
                    {job.poster.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {job.poster.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Component */}
            {user &&
              job.status === "PLANNING" &&
              // Don't show chat if job is posted by an admin
              (!job.poster.role ||
                (job.poster.role !== "ADMIN" &&
                  job.poster.role !== "admin")) && (
                <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                  <div className="border-b px-6 py-4">
                    <h2 className="text-xl font-semibold">Chat with us</h2>
                  </div>
                  <div className="p-6">
                    {isJobPoster || isAdmin ? (
                      <SimpleJobChat
                        jobId={job.id}
                        jobPosterId={job.poster.id}
                      />
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Interested in this job? Contact the client directly.
                        </p>
                        <Button className="w-full" asChild>
                          <Link href={`/messages?jobId=${job.id}`}>
                            Send Message
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/80"
              onClick={closeImageModal}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
