"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
  const redirectUrl = searchParams.get("from") || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

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
      let response;
      try {
        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginData.email,
            password: loginData.password,
          }),
        });
      } catch (fetchError) {
        console.error("Network error during login fetch:", fetchError);
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
        throw new Error(data.error || "Failed to login");
      }

      // Use the login function from auth context
      login(data.user);

      // Set the user in a cookie for server-side access
      document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`; // 7 days

      toast.success("Login successful!");

      // Redirect to the original URL or home page
      router.push(redirectUrl);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to login");
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

      toast.success("Registration successful! Please log in.");

      // Auto-login the user after registration
      try {
        let loginResponse;
        try {
          loginResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: registerData.email,
              password: registerData.password,
            }),
          });
        } catch (fetchError) {
          console.error("Network error during auto-login fetch:", fetchError);
          throw new Error(
            "Auto-login failed due to network error. Please log in manually."
          );
        }

        // Check if the login response is JSON before trying to parse it
        const loginContentType = loginResponse.headers.get("content-type");
        if (
          !loginContentType ||
          !loginContentType.includes("application/json")
        ) {
          // Handle non-JSON response
          const text = await loginResponse.text();
          console.error("Received non-JSON response during auto-login:", text);
          throw new Error("Auto-login failed. Please log in manually.");
        }

        let loginData;
        try {
          loginData = await loginResponse.json();
        } catch (jsonError) {
          console.error(
            "Error parsing JSON response during auto-login:",
            jsonError
          );
          throw new Error("Auto-login failed. Please log in manually.");
        }

        if (loginResponse.ok) {
          // Use the login function from auth context
          login(loginData.user);

          // Set the user in a cookie for server-side access
          document.cookie = `user=${JSON.stringify(
            loginData.user
          )}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days

          toast.success("You've been automatically logged in!");

          // Redirect to the original URL or home page
          router.push(redirectUrl);
          return;
        }
      } catch (error) {
        console.error("Auto-login error:", error);
        // Continue with normal flow if auto-login fails
      }

      // Reset form and switch to login tab if auto-login fails
      setRegisterData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Find the login tab trigger and click it
      const loginTab = document.querySelector(
        '[data-value="login"]'
      ) as HTMLElement;
      if (loginTab) loginTab.click();
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to register"
      );
    } finally {
      setIsLoading(false);
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

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
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
                    className="text-sm text-muted-foreground hover:text-foreground"
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName-register">First name</Label>
                  <Input
                    id="firstName-register"
                    placeholder="John"
                    value={registerData.firstName}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName-register">Last name</Label>
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
                  placeholder="name@example.com"
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
