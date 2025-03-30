"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // Get email from URL
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleUnsubscribe = async () => {
    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      // Connect to the API to unsubscribe the user
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus("success");
        setMessage(
          data.message ||
            "You have been successfully unsubscribed from all marketing emails."
        );
      } else {
        const data = await response.json();
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setStatus("error");
      setMessage(
        "An error occurred while processing your request. Please try again."
      );
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Email Unsubscribe</CardTitle>
          <CardDescription>Manage your email preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "idle" || status === "loading" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Enter your email address to unsubscribe from our marketing
                emails. You will still receive transactional emails related to
                your account.
              </p>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                />
                {message && <p className="text-sm text-red-500">{message}</p>}
              </div>
            </div>
          ) : status === "success" ? (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Unsubscribed Successfully
              </h3>
              <p className="text-muted-foreground">{message}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Something Went Wrong</h3>
              <p className="text-muted-foreground">{message}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setStatus("idle")}
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          {(status === "idle" || status === "loading") && (
            <Button
              onClick={handleUnsubscribe}
              disabled={status === "loading" || !email}
            >
              {status === "loading" ? "Processing..." : "Unsubscribe"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-md mx-auto py-12 px-4">Loading...</div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
