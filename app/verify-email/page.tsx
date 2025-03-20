"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

// Extract the content that uses useSearchParams
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your email...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const verifyEmail = async (token: string | null) => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    try {
      console.log(
        "Sending verification request with token:",
        token.substring(0, 10) + "..."
      );

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      // Handle non-JSON responses (like network errors)
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          throw new Error(`Failed to parse server response: ${jsonError}`);
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}...`
        );
      }

      console.log("Verification response:", data);

      if (response.ok) {
        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed. Please try again.");

        // Set detailed error info for debugging
        if (data.details) {
          setErrorDetails(data.details);
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage("An error occurred during verification.");
      setErrorDetails(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setStatus("verifying");
    setMessage("Retrying verification...");
    setErrorDetails(null);

    const token = searchParams.get("token");
    verifyEmail(token);
  };

  const handleDiagnostics = () => {
    window.open("/api/auth/debug", "_blank");
  };

  useEffect(() => {
    const token = searchParams.get("token");
    verifyEmail(token);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 p-6 bg-card rounded-lg shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Email Verification</h1>

          {status === "verifying" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin mb-2">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>{message}</AlertDescription>

              {errorDetails && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md text-left">
                  <p className="font-semibold">Error details:</p>
                  <p className="font-mono text-xs break-all">{errorDetails}</p>
                </div>
              )}
            </Alert>
          )}
        </div>

        {status !== "verifying" && (
          <div className="flex flex-col gap-2 items-center">
            {status === "success" ? (
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
            ) : (
              <div className="space-y-2 w-full">
                <Button
                  onClick={handleRetry}
                  className="w-full"
                  disabled={isRetrying}
                >
                  Try Again
                </Button>

                <Button
                  onClick={() =>
                    router.push(
                      "/api/auth/resend-verification?email=" +
                        searchParams.get("email")
                    )
                  }
                  variant="outline"
                  className="w-full"
                >
                  Resend Verification Email
                </Button>

                <Button
                  onClick={() => router.push("/login")}
                  variant="link"
                  className="w-full"
                >
                  Back to Login
                </Button>

                <Button
                  onClick={handleDiagnostics}
                  variant="ghost"
                  size="sm"
                  className="text-xs w-full mt-4"
                >
                  Run Diagnostics
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense
export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin mr-2">
            <RefreshCw className="h-5 w-5" />
          </div>
          Verifying...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
