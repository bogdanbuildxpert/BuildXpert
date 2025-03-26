"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
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
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  // Get the redirect URL from the query parameters
  let redirectUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Handle the tab state
  const defaultTab =
    searchParams.get("tab") === "register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Remove the redundant redirection code since middleware handles it now
  // Just keep a log message for debugging
  useEffect(() => {
    if (auth.user) {
      console.log(
        "User is already logged in, middleware will handle redirect to appropriate page"
      );
    }
  }, [auth.user]);

  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle register form changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const field = id.replace("-register", "");
    setRegisterData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setStatusMessage("");
    setError("");

    try {
      const response = await signIn("credentials", {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });

      if (response?.error) {
        setStatus("error");
        setError(response.error);
        return;
      }

      // Redirect on successful login
      setStatus("success");
      setStatusMessage("Login successful! Redirecting...");
      router.push(redirectUrl);
    } catch (error) {
      setStatus("error");
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setStatusMessage("");
    setError("");

    try {
      // Validate passwords match
      if (registerData.password !== registerData.confirmPassword) {
        setError("Passwords do not match");
        setStatus("idle");
        return;
      }

      // Submit registration
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
          }),
        });
      } catch (fetchError) {
        console.error("Network error during registration:", fetchError);
        throw new Error("Network error. Please check your connection.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      // Handle successful registration
      setStatusMessage(
        data.message ||
          "Registration successful. Please check your email to verify your account."
      );
      setStatus("success");

      // Reset form
      setRegisterData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Automatically switch to login tab after 3 seconds
      setTimeout(() => {
        const loginTab = document.querySelector('[value="login"]');
        if (loginTab) (loginTab as HTMLElement).click();
      }, 3000);
    } catch (error) {
      setStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to register";
      setError(errorMessage);
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

        <Card className="mx-auto max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Login" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Enter your credentials to login to your account"
                : "Enter your details to create a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={defaultTab}
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="youremail@example.com"
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
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot Password?
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

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {statusMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
                      {statusMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={status === "submitting" || status === "success"}
                  >
                    {status === "submitting" ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      Don&apos;t have an account?{" "}
                    </span>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => {
                        const registerTab =
                          document.querySelector('[value="register"]');
                        if (registerTab) (registerTab as HTMLElement).click();
                      }}
                    >
                      Sign up
                    </button>
                  </div>
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
                      placeholder="john.doe@example.com"
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
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long
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

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {statusMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
                      {statusMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={status === "submitting" || status === "success"}
                  >
                    {status === "submitting" ? "Registering..." : "Register"}
                  </Button>

                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                    </span>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => {
                        const loginTab =
                          document.querySelector('[value="login"]');
                        if (loginTab) (loginTab as HTMLElement).click();
                      }}
                    >
                      Login
                    </button>
                  </div>
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
          </CardContent>
        </Card>
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
