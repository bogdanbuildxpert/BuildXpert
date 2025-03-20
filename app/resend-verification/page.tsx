"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function ResendVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(
    searchParams.get("success") === "true"
  );

  // Get error and details from URL
  const errorParam = searchParams.get("error");
  const detailsParam = searchParams.get("details");
  let errorDetails = null;

  if (detailsParam) {
    try {
      errorDetails = JSON.parse(decodeURIComponent(detailsParam));
    } catch (e) {
      console.error("Failed to parse error details:", e);
    }
  }

  // Handle error messages
  let errorMessage = "";
  if (errorParam === "user-not-found") {
    errorMessage = "We couldn't find an account with this email address.";
  } else if (errorParam === "server-error") {
    errorMessage = "There was a problem sending the verification email.";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to send verification email");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error sending verification email:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 p-6 bg-card rounded-lg shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Resend Verification Email</h1>
          <p className="text-muted-foreground">
            {success
              ? "We've sent a new verification email. Please check your inbox."
              : "Enter your email address below to receive a new verification link."}
          </p>
        </div>

        {/* Success message */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Email sent!</AlertTitle>
            <AlertDescription className="text-green-700">
              We've sent a verification link to your email address. Please check
              your inbox and spam folder.
            </AlertDescription>
          </Alert>
        )}

        {/* Error message */}
        {(error || errorMessage) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || errorMessage}
              {errorDetails && (
                <div className="mt-2 p-2 bg-destructive/10 rounded-md text-xs font-mono">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Verification Email"}
            </Button>
          </form>
        )}

        <div className="text-center pt-4">
          <Button
            variant="link"
            onClick={() => router.push("/login")}
            className="text-sm"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
