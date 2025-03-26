"use client";

import { useState } from "react";
import Link from "next/link";

interface TestResult {
  status: "idle" | "loading" | "success" | "error";
  data: any;
  error?: string;
  timestamp?: string;
}

export default function DebugPage() {
  const [databaseTest, setDatabaseTest] = useState<TestResult>({
    status: "idle",
    data: null,
  });

  const [regularRegisterTest, setRegularRegisterTest] = useState<TestResult>({
    status: "idle",
    data: null,
  });

  const [debugRegisterTest, setDebugRegisterTest] = useState<TestResult>({
    status: "idle",
    data: null,
  });

  const testDatabase = async () => {
    setDatabaseTest({ status: "loading", data: null });
    try {
      const response = await fetch("/api/debug/database");
      const data = await response.json();
      setDatabaseTest({
        status: response.ok ? "success" : "error",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setDatabaseTest({
        status: "error",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  const testRegularRegister = async () => {
    setRegularRegisterTest({ status: "loading", data: null });

    try {
      const testEmail = `test_${Date.now()}@example.com`;
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: testEmail,
          password: "Test12345!",
        }),
      });

      const data = await response.json();
      setRegularRegisterTest({
        status: response.ok ? "success" : "error",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setRegularRegisterTest({
        status: "error",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  const testDebugRegister = async () => {
    setDebugRegisterTest({ status: "loading", data: null });

    try {
      const testEmail = `debug_${Date.now()}@example.com`;
      const response = await fetch("/api/debug/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Debug User",
          email: testEmail,
          password: "Debug12345!",
        }),
      });

      const data = await response.json();
      setDebugRegisterTest({
        status: response.ok ? "success" : "error",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setDebugRegisterTest({
        status: "error",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">BuildXpert Debug Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Database Connection</h2>
          <button
            onClick={testDatabase}
            disabled={databaseTest.status === "loading"}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {databaseTest.status === "loading"
              ? "Testing..."
              : "Test Database Connection"}
          </button>

          {databaseTest.status !== "idle" && (
            <div className="mt-4">
              <h3
                className={`font-semibold ${
                  databaseTest.status === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Status: {databaseTest.status}
              </h3>
              {databaseTest.timestamp && (
                <p className="text-sm text-gray-500 mb-2">
                  Tested at: {new Date(databaseTest.timestamp).toLocaleString()}
                </p>
              )}
              {databaseTest.error && (
                <p className="text-red-600 mb-2">{databaseTest.error}</p>
              )}
              {databaseTest.data && (
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(databaseTest.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Registration Tests</h2>

          <div className="flex flex-col space-y-2">
            <button
              onClick={testRegularRegister}
              disabled={regularRegisterTest.status === "loading"}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-green-300"
            >
              {regularRegisterTest.status === "loading"
                ? "Testing..."
                : "Test Regular Register"}
            </button>

            <button
              onClick={testDebugRegister}
              disabled={debugRegisterTest.status === "loading"}
              className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 disabled:bg-purple-300"
            >
              {debugRegisterTest.status === "loading"
                ? "Testing..."
                : "Test Debug Register"}
            </button>
          </div>

          {regularRegisterTest.status !== "idle" && (
            <div className="mt-4 border-t pt-2">
              <h3
                className={`font-semibold ${
                  regularRegisterTest.status === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Regular Register: {regularRegisterTest.status}
              </h3>
              {regularRegisterTest.timestamp && (
                <p className="text-sm text-gray-500 mb-2">
                  Tested at:{" "}
                  {new Date(regularRegisterTest.timestamp).toLocaleString()}
                </p>
              )}
              {regularRegisterTest.error && (
                <p className="text-red-600 mb-2">{regularRegisterTest.error}</p>
              )}
              {regularRegisterTest.data && (
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(regularRegisterTest.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {debugRegisterTest.status !== "idle" && (
            <div className="mt-4 border-t pt-2">
              <h3
                className={`font-semibold ${
                  debugRegisterTest.status === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Debug Register: {debugRegisterTest.status}
              </h3>
              {debugRegisterTest.timestamp && (
                <p className="text-sm text-gray-500 mb-2">
                  Tested at:{" "}
                  {new Date(debugRegisterTest.timestamp).toLocaleString()}
                </p>
              )}
              {debugRegisterTest.error && (
                <p className="text-red-600 mb-2">{debugRegisterTest.error}</p>
              )}
              {debugRegisterTest.data && (
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugRegisterTest.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border rounded-lg p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Debug Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/debug-register"
            className="bg-gray-100 hover:bg-gray-200 p-3 rounded text-center"
          >
            Debug Register Form
          </Link>
          <Link
            href="/"
            className="bg-gray-100 hover:bg-gray-200 p-3 rounded text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
