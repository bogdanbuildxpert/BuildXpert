"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Extract the content that uses useSearchParams
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your email...");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

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

        const data = await response.json();
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
        setErrorDetails(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 p-6 bg-card rounded-lg shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Email Verification</h1>
          <p
            className={
              status === "error" ? "text-destructive" : "text-muted-foreground"
            }
          >
            {message}
          </p>

          {errorDetails && status === "error" && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md text-left">
              <p className="font-semibold">Error details:</p>
              <p className="font-mono text-xs break-all">{errorDetails}</p>
            </div>
          )}
        </div>

        {status !== "verifying" && (
          <div className="flex justify-center">
            {status === "success" ? (
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={() => router.push("/login")}>
                  Go to Login
                </Button>
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => router.push("/api/auth/resend-verification")}
                    className="text-sm"
                  >
                    Resend verification email
                  </Button>
                </div>
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
          Verifying...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
