"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

// Extract the content part that uses useSearchParams
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setIsTokenValid(true);
        }
      } catch (error) {
        console.error("Error verifying token:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: passwordData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Password reset successfully");
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="container max-w-md py-16 md:py-24">
        <div className="space-y-6 text-center">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold">Verifying Link</h1>
            <p className="text-muted-foreground mt-2">
              Please wait while we verify your reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or missing token
  if (!isTokenValid) {
    return (
      <div className="container max-w-md py-16 md:py-24">
        <div className="space-y-6 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-3xl font-bold">Invalid or Expired Link</h1>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Button asChild className="mt-4">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="container max-w-md py-16 md:py-24">
        <div className="space-y-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold">Password Reset Complete</h1>
          <p className="text-muted-foreground">
            Your password has been reset successfully.
          </p>
          <Button asChild className="mt-4">
            <Link href="/login">Log in with your new password</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="container max-w-md py-16 md:py-24">
      <div className="space-y-6 fade-in">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Reset Your Password</h1>
          <p className="text-muted-foreground">
            Enter a new password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={passwordData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Wrap with Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-md py-16 md:py-24 text-center">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
