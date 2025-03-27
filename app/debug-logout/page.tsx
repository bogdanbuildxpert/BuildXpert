"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "next-auth/react";

export default function DebugLogoutPage() {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [cookies, setCookies] = useState<string>("");

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    // Check cookies on mount
    setCookies(document.cookie);

    // Set up intervals to check cookies
    const interval = setInterval(() => {
      setCookies(document.cookie);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleNormalLogout = async () => {
    addLog("Starting normal logout via auth context");
    try {
      await logout();
      addLog("Normal logout completed");
    } catch (error) {
      addLog(`Error during normal logout: ${error}`);
    }
  };

  const handleNextAuthLogout = async () => {
    addLog("Starting NextAuth signOut with redirect=true");
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/login?from=direct-logout&t=" + Date.now(),
      });
      addLog("NextAuth signOut completed"); // This may not execute due to redirect
    } catch (error) {
      addLog(`Error during NextAuth signOut: ${error}`);
    }
  };

  const handleNextAuthLogoutNoRedirect = async () => {
    addLog("Starting NextAuth signOut with redirect=false");
    try {
      await signOut({ redirect: false });
      addLog("NextAuth signOut without redirect completed");
    } catch (error) {
      addLog(`Error during NextAuth signOut: ${error}`);
    }
  };

  const handleDirectNavigation = () => {
    addLog("Performing direct navigation to login");
    window.location.href = "/login?from=direct-navigation&t=" + Date.now();
  };

  const handleFormSubmit = () => {
    addLog("Creating and submitting form");
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/login";

      const methodField = document.createElement("input");
      methodField.type = "hidden";
      methodField.name = "_method";
      methodField.value = "GET";
      form.appendChild(methodField);

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      addLog(`Error during form submission: ${error}`);
    }
  };

  const clearAllCookies = () => {
    addLog("Manually clearing all cookies");
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    setCookies(document.cookie);
  };

  return (
    <div className="container max-w-4xl py-16">
      <h1 className="text-3xl font-bold mb-8">Debug Logout</h1>

      <div className="flex flex-col space-y-4 mb-8">
        <div className="p-4 bg-slate-100 rounded-md">
          <h2 className="text-xl font-bold mb-2">Current User</h2>
          <pre className="text-sm overflow-auto">
            {user ? JSON.stringify(user, null, 2) : "Not logged in"}
          </pre>
        </div>

        <div className="p-4 bg-slate-100 rounded-md">
          <h2 className="text-xl font-bold mb-2">Current Cookies</h2>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {cookies || "No cookies found"}
          </pre>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Button onClick={handleNormalLogout}>
          Normal Logout (via auth context)
        </Button>

        <Button onClick={handleNextAuthLogout} variant="outline">
          NextAuth Logout (with redirect)
        </Button>

        <Button onClick={handleNextAuthLogoutNoRedirect} variant="outline">
          NextAuth Logout (no redirect)
        </Button>

        <Button onClick={handleDirectNavigation} variant="outline">
          Direct Navigation to Login
        </Button>

        <Button onClick={handleFormSubmit} variant="outline">
          Form POST Submission
        </Button>

        <Button onClick={clearAllCookies} variant="destructive">
          Clear All Cookies
        </Button>
      </div>

      <div className="p-4 bg-slate-100 rounded-md">
        <h2 className="text-xl font-bold mb-2">Logs</h2>
        <div className="text-sm font-mono bg-slate-800 text-white p-4 rounded-md h-80 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
