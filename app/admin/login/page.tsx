"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

// Create a client component that uses useSearchParams
function AdminLoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "ADMIN")) {
      const redirectTo = searchParams.get("from") || "/admin/dashboard";
      router.push(redirectTo);
    }
  }, [user, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, this would be an API call to verify credentials
      // For demo purposes, we're using a simple check
      if (email === "bogdanhutuleac@outlook.com" && password === "admin123") {
        // Create a user object with admin role
        const userData = {
          id: "1",
          name: "Bogdan Hutuleac",
          email: email,
          role: "ADMIN",
        };

        // Set the user in context and localStorage
        login(userData);

        // Set the user in a cookie for server-side access
        document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${
          60 * 60 * 24 * 7
        }`; // 7 days

        toast.success("Login successful");

        // Redirect to the original page or dashboard
        const redirectTo = searchParams.get("from") || "/admin/dashboard";
        router.push(redirectTo);
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border p-8 shadow-sm fade-in">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary p-2">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">BuildXpert Admin</h1>
          <p className="text-sm text-muted-foreground">
            Secure access for authorized personnel only
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="bogdanhutuleac@outlook.com"
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
              <p className="text-xs text-muted-foreground mt-1">
                Demo credentials: bogdanhutuleac@outlook.com / admin123
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Login"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            Return to main site
          </Link>
        </div>
      </div>
    </div>
  );
}

// Export the page component with Suspense boundary
export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
