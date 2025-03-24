"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DebugLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleDebugLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      // First, try our debug endpoint
      const debugResponse = await fetch("/api/auth/debug-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const debugData = await debugResponse.json();
      setResult(debugData);

      if (debugResponse.ok) {
        toast.success("Debug login successful!");
      } else {
        toast.error(`Debug login failed: ${debugData.error}`);
      }
    } catch (error) {
      console.error("Debug login error:", error);
      setResult({ error: "Debug error", message: String(error) });
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16 md:py-24">
      <div className="space-y-6 fade-in">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Debug Login</h1>
          <p className="text-muted-foreground">
            Testing credentials and authentication
          </p>
        </div>

        <form onSubmit={handleDebugLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Testing..." : "Test Login"}
          </Button>
        </form>

        {result && (
          <div className="mt-8 space-y-2">
            <h2 className="text-xl font-bold">Debug Results</h2>
            <pre className="p-4 bg-slate-100 rounded-md overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
