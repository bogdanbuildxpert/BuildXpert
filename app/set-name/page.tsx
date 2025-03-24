"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function SetNamePage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to set your name");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setLoading(true);

    try {
      // Use our new endpoint
      const response = await fetch(
        `/api/user/set-display-name?email=${encodeURIComponent(
          user.email
        )}&name=${encodeURIComponent(name)}`
      );

      if (response.ok) {
        // Update the user in the context
        login({
          ...user,
          name: name,
        });

        toast.success("Name updated successfully");
        router.push("/");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update name");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update name"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <p>You must be logged in to set your name</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-12">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Set Your Name</h1>
          <p className="text-muted-foreground">
            Your name will be displayed in the navigation bar and other places
            in the application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Name"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <Button variant="link" onClick={() => router.push("/")}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
