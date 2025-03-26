"use client";

import { useState } from "react";

export default function DebugRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setResult(null);

    try {
      // First try normal register
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const registerData = await registerResponse.json();

      // If failed, try debug register
      if (!registerResponse.ok) {
        console.log("Normal register failed, trying debug register");

        const debugResponse = await fetch("/api/debug/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const debugData = await debugResponse.json();

        setResult({
          normalRegister: {
            success: false,
            status: registerResponse.status,
            data: registerData,
          },
          debugRegister: {
            success: debugResponse.ok,
            status: debugResponse.status,
            data: debugData,
          },
        });

        setStatus(debugResponse.ok ? "success" : "error");
      } else {
        setResult({
          normalRegister: {
            success: true,
            status: registerResponse.status,
            data: registerData,
          },
        });
        setStatus("success");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setStatus("error");
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Debug Registration</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {status === "submitting" ? "Registering..." : "Register"}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Registration Result</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
