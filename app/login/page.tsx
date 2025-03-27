"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { signIn, getSession, signOut, useSession } from "next-auth/react";
import { Separator } from "@/components/ui/separator";

// Extract the inner content that uses useSearchParams
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Get the redirect URL from the query parameters
  const redirectUrl =
    searchParams.get("redirect") || searchParams.get("from") || "/";

  // Get the tab parameter to determine which tab to show initially
  const activeTab =
    searchParams.get("tab") === "register" ? "register" : "login";

  // Remove the redundant redirection code since middleware handles it now
  // Just keep a log message for debugging
  useEffect(() => {
    if (auth.user) {
      console.log(
        "User is already logged in, middleware will handle redirect to appropriate page"
      );
    }
  }, [auth.user]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const field = id.replace("-register", "");
    setRegisterData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Starting login process with credentials");

      const result = await signIn("credentials", {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error("Login failed - please try again");
      }

      // Simple success message
      toast.success("Login successful!");

      // Use a client-side approach that works better with NextAuth
      try {
        // First update the session
        await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include", // Important to include credentials for cookies
          headers: {
            "Cache-Control": "no-cache, no-store, max-age=0",
            Pragma: "no-cache",
          },
        });

        console.log("Session refreshed");

        // Longer timeout to ensure everything is established
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Now do a hard reload to the destination to ensure all
        // cookies and state are properly established
        const destination = result?.url || redirectUrl;
        window.location.href = destination;
      } catch (sessionError) {
        console.error("Error refreshing session:", sessionError);
        // Fallback to redirect anyway
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to login");

      // Clear any partial session state
      await signOut({ redirect: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      let response;
      try {
        response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `${registerData.firstName} ${registerData.lastName}`,
            email: registerData.email,
            password: registerData.password,
            role: "CLIENT", // All new accounts are CLIENT by default
          }),
        });
      } catch (fetchError) {
        console.error("Network error during registration fetch:", fetchError);
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }

      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Handle non-JSON response
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        throw new Error(
          "Server returned an invalid response. Please try again later."
        );
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        throw new Error(
          "Failed to process server response. Please try again later."
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      // Show success message with email verification instructions
      toast.success(
        "Registration successful! Please check your email to verify your account before logging in.",
        {
          duration: 6000, // Show for 6 seconds
        }
      );

      // Reset the registration form
      setRegisterData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Switch to the login tab
      document.getElementById("login-tab")?.click();
    } catch (error: unknown) {
      console.error("Registration error:", error);

      // Use type checking to safely access the message property
      const errorMessage =
        error instanceof Error ? error.message : "Failed to register";

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      // Use callbackUrl directly in signIn for Google OAuth
      await signIn("google", {
        callbackUrl: redirectUrl,
        redirect: true, // Force redirect
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16 md:py-24">
      <div className="space-y-6 fade-in">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">
            Login to your account or create a new one
          </p>
        </div>

        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger id="login-tab" value="login">
              Login
            </TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? "Connecting..." : "Google"}
            </Button>

            {/* <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  const registerTab = document.querySelector(
                    '[value="register"]'
                  ) as HTMLElement;
                  if (registerTab) registerTab.click();
                }}
                className="text-primary underline underline-offset-4 hover:text-primary/90 p-0 m-0 h-auto bg-transparent"
              >
                Sign up
              </button>
            </p> */}
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName-register">First Name</Label>
                  <Input
                    id="firstName-register"
                    placeholder="John"
                    value={registerData.firstName}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName-register">Last Name</Label>
                  <Input
                    id="lastName-register"
                    placeholder="Doe"
                    value={registerData.lastName}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-register">Email</Label>
                <Input
                  id="email-register"
                  type="email"
                  placeholder="you@example.com"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-register">Password</Label>
                <Input
                  id="password-register"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword-register">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword-register"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-primary underline hover:text-primary/90"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-primary underline hover:text-primary/90"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Wrap with Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-md py-16 md:py-24 text-center">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
