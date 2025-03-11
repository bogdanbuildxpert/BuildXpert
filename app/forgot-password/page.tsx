"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("Password reset instructions sent to your email");
      } else {
        toast.error(data.error || "Failed to send reset instructions");
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16 md:py-24">
      <div className="space-y-6 fade-in">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Reset Your Password</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you instructions to reset
            your password
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 p-6 text-center">
              <div className="flex justify-center mb-4">
                <Mail className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-green-700 mb-2">
                Check Your Email
              </h2>
              <p className="text-green-600 mb-4">
                We've sent password reset instructions to:
                <br />
                <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-green-600">
                If you don't see the email, check your spam folder or make sure
                you entered the correct email address.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <Button onClick={() => setIsSubmitted(false)} variant="outline">
                Try a different email
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Return to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
