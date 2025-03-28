"use client";

import { useState, useRef } from "react";
import { useJobForm } from "@/lib/contexts/job-form-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCsrfToken } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

// Extended interface for auth context that includes forceRefresh
interface ExtendedAuth {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  resetInactivityTimer: () => void;
  forceRefresh?: () => Promise<void>;
  login?: (userData: any) => Promise<void>;
}

export default function ReviewPage() {
  const { state, updateField, prevStep, resetForm, setStep, validateStep } =
    useJobForm();
  const { formData } = state;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth() as ExtendedAuth;
  const { user, forceRefresh } = auth;
  const csrfTokenRef = useRef<string | null>(null);

  // Navigate to specific step for editing
  const handleEditStep = (step: number) => {
    setStep(step);
  };

  const generateJobDescription = () => {
    return `
Posted by: ${user?.name || user?.email || "Anonymous"}
Property Type: ${formData.propertyType}
Location: ${formData.jobLocation}
Areas to be Painted: ${formData.paintingAreas.join(", ")}
Surface Condition: ${formData.surfaceCondition}
Paint Type: ${formData.paintType}
Color Preferences: ${formData.colorPreferences}
Special Finishes: ${formData.specialFinishes}
Estimated Area: ${formData.estimatedArea}
Timeline: ${
      formData.startDate
        ? format(new Date(formData.startDate), "PPP")
        : "Not specified"
    } to ${
      formData.endDate
        ? format(new Date(formData.endDate), "PPP")
        : "Not specified"
    }
Additional Requirements: ${
      formData.furnitureMoving ? "Furniture moving/protection needed. " : ""
    }${formData.scaffolding ? "Scaffolding required. " : ""}
Additional Notes: ${formData.additionalNotes}
    `.trim();
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      console.log("Starting job submission process");

      // Validate all steps before submission
      for (let step = 0; step < 5; step++) {
        if (!validateStep(step)) {
          toast.error("Please complete all required fields before submitting");
          setStep(step);
          setIsLoading(false);
          return;
        }
      }

      // Check if we have a user
      if (!user || !user.id) {
        console.error("No authenticated user found for job submission");
        toast.error("Authentication error. Please try logging in again.");
        setIsLoading(false);
        return;
      }

      console.log("User authenticated for job submission:", user.email);

      // Prepare the metadata object first with correct types
      const metadata: any = {
        propertyType: formData.propertyType,
        paintingAreas: formData.paintingAreas,
        surfaceCondition: formData.surfaceCondition,
        paintType: formData.paintType,
        colorPreferences: formData.colorPreferences,
        specialFinishes: formData.specialFinishes,
        estimatedArea: formData.estimatedArea
          ? parseInt(formData.estimatedArea, 10)
          : 0,
        furnitureMoving: formData.furnitureMoving,
        scaffolding: formData.scaffolding,
        additionalNotes: formData.additionalNotes,
        images: formData.images,
      };

      // Add dates conditionally to avoid type issues
      if (formData.startDate) {
        metadata.startDate = new Date(formData.startDate).toISOString();
      }
      if (formData.endDate) {
        metadata.endDate = new Date(formData.endDate).toISOString();
      }

      // Prepare the job data
      const jobData = {
        title: `Painting Job - ${formData.propertyType} Property`,
        description: generateJobDescription(),
        location: formData.jobLocation,
        metadata: metadata,
      };

      // Get a fresh CSRF token if needed
      if (!csrfTokenRef.current) {
        try {
          const token = await getCsrfToken();
          csrfTokenRef.current = token || null;
          console.log("Obtained CSRF token for submission");
        } catch (error) {
          console.error("Failed to get CSRF token:", error);
        }
      }

      // First, try to refresh auth state and sync cookies
      try {
        console.log("Refreshing auth state before submission");

        // Call the auth check endpoint to ensure cookies are set
        const authCheckResponse = await fetch(
          `/api/auth/check?t=${Date.now()}`,
          {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
            credentials: "include",
          }
        );

        if (authCheckResponse.ok) {
          const authData = await authCheckResponse.json();
          console.log("Auth check successful:", authData);

          // Try to get the auth token from cookies
          const cookies = document.cookie.split(";").map((c) => c.trim());
          const authTokenCookie = cookies.find((c) =>
            c.startsWith("auth_token=")
          );

          if (authTokenCookie) {
            const authToken = authTokenCookie.split("=")[1];
            // Store in localStorage for easier access in future API calls
            localStorage.setItem("auth_token", authToken);
            console.log("Auth token stored in localStorage");
          } else {
            // If no auth_token cookie, create one
            const tokenData = {
              id: user.id,
              email: user.email,
              exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
            };
            const newAuthToken = btoa(JSON.stringify(tokenData));
            localStorage.setItem("auth_token", newAuthToken);
            console.log("Created and stored new auth token");
          }
        } else {
          console.warn("Auth check failed, proceeding anyway");
        }

        // Force a refresh of the auth context if available
        if (forceRefresh) {
          await forceRefresh();
        }
      } catch (authError) {
        console.error("Error refreshing auth state:", authError);
        // Continue anyway
      }

      console.log("Submitting job data to API");

      // Get the current cookie for debugging
      const cookies = document.cookie.split(";").map((c) => c.trim());
      const hasUserCookie = cookies.some((c) => c.startsWith("user="));
      const hasSessionCookie = cookies.some((c) =>
        c.startsWith("next-auth.session-token=")
      );
      const hasAuthToken = cookies.some((c) => c.startsWith("auth_token="));

      console.log("Cookie status before submission:", {
        hasUserCookie,
        hasSessionCookie,
        hasAuthToken,
        cookiesCount: cookies.length,
      });

      // Get auth token from localStorage
      const authToken = localStorage.getItem("auth_token") || "";

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfTokenRef.current && {
            "csrf-token": csrfTokenRef.current,
          }),
          Authorization: `Bearer ${authToken}`,
          "X-User-ID": user.id, // Add user ID to headers as fallback
        },
        credentials: "include", // Important: include credentials for cookies
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        // If we get a 401, try once more with user_id in the URL
        if (response.status === 401) {
          console.log("Got 401, trying alternative submission method");

          // Try calling the auth check endpoint one more time
          await fetch(`/api/auth/check?t=${Date.now()}`, {
            credentials: "include",
          });

          // Try again with user_id in the URL as a query parameter
          const retryResponse = await fetch(`/api/jobs?user_id=${user.id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            credentials: "include",
            body: JSON.stringify(jobData),
          });

          if (retryResponse.ok) {
            const result = await retryResponse.json();
            toast.success("Job posted successfully!");
            console.log("Job created successfully on retry:", result.id);
            resetForm();
            router.push(`/jobs/${result.id}`);
            return;
          } else {
            console.error(
              "Retry also failed with status:",
              retryResponse.status
            );
          }
        }

        const responseText = await response.text();
        let error;
        try {
          error = JSON.parse(responseText);
        } catch (e) {
          error = { message: responseText || "Unknown error occurred" };
        }
        throw new Error(error.message || error.error || "Failed to create job");
      }

      const result = await response.json();
      toast.success("Job posted successfully!");

      console.log("Job created successfully:", result.id);

      // Reset the form data after successful submission
      resetForm();

      // Redirect to the job page
      router.push(`/jobs/${result.id}`);
    } catch (error: any) {
      console.error("Error submitting job:", error);

      // Check for authentication errors and provide specific guidance
      if (
        error.message?.includes("Unauthorized") ||
        error.message?.includes("401")
      ) {
        toast.error(
          "Authentication error. Please try logging out and logging back in."
        );

        // Add a button to go to login page
        toast("You may need to refresh your session", {
          action: {
            label: "Go to Login",
            onClick: () => router.push("/login?redirect=/post-job/review"),
          },
        });
      } else {
        // Generic error message for other types of errors
        toast.error(error.message || "Failed to submit job. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review Your Job Posting</h2>
      <p className="text-muted-foreground">
        Review your job details before submitting. You can go back to any
        section to make changes.
      </p>

      <div className="space-y-8">
        {/* Client Information */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">Client Information</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditStep(0)}
            >
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p>{formData.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Phone</Label>
              <p>{formData.phone}</p>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">Job Details</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditStep(1)}
            >
              Edit
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">
                Property Type
              </Label>
              <p className="capitalize">{formData.propertyType}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Job Location
              </Label>
              <p>{formData.jobLocation}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Areas to be Painted
              </Label>
              <p>
                {formData.paintingAreas.length > 0
                  ? formData.paintingAreas.join(", ")
                  : "None specified"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Surface Condition
              </Label>
              <p className="capitalize">
                {formData.surfaceCondition || "Not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Painting Preferences */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">Painting Preferences</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditStep(2)}
            >
              Edit
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">
                Paint Type
              </Label>
              <p className="capitalize">{formData.paintType}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Color Preferences
              </Label>
              <p>{formData.colorPreferences || "Not specified"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Special Finishes
              </Label>
              <p>{formData.specialFinishes || "Not specified"}</p>
            </div>
          </div>
        </div>

        {/* Project Scope */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">Project Scope & Timeline</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditStep(3)}
            >
              Edit
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">
                Estimated Area
              </Label>
              <p>
                {formData.estimatedArea
                  ? `${formData.estimatedArea} sq ft`
                  : "Not specified"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">
                  Start Date
                </Label>
                <p>
                  {formData.startDate
                    ? format(new Date(formData.startDate), "PPP")
                    : "Not specified"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">
                  End Date
                </Label>
                <p>
                  {formData.endDate
                    ? format(new Date(formData.endDate), "PPP")
                    : "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Requirements */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">Additional Requirements</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditStep(4)}
            >
              Edit
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">
                Additional Services
              </Label>
              <ul className="list-disc list-inside">
                {formData.furnitureMoving && (
                  <li>Furniture Moving/Protection</li>
                )}
                {formData.scaffolding && <li>Scaffolding Required</li>}
                {!formData.furnitureMoving && !formData.scaffolding && (
                  <li>None selected</li>
                )}
              </ul>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">
                Additional Notes
              </Label>
              <p>{formData.additionalNotes || "Not specified"}</p>
            </div>
            {formData.images.length > 0 && (
              <div>
                <Label className="text-muted-foreground text-sm">
                  Reference Images
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Reference ${index + 1}`}
                        className="h-20 w-full object-cover rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Previous
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Job Posting"
          )}
        </Button>
      </div>
    </div>
  );
}
