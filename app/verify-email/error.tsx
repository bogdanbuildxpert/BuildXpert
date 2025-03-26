"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console
    console.error("Verification page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto max-w-md space-y-6 p-6 bg-card rounded-lg shadow-lg">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Verifying Email</AlertTitle>
          <AlertDescription>
            We encountered an error while trying to verify your email.
          </AlertDescription>
        </Alert>

        <div className="p-4 border border-gray-200 rounded bg-gray-50 text-sm">
          <p className="font-semibold mb-2">Error details:</p>
          <p className="text-xs break-all">{error.message}</p>
          {error.digest && (
            <p className="text-xs mt-1 text-gray-500">ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/api/auth/resend-verification">
              Resend Verification Email
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
