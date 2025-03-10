"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectList from "@/components/ProjectList";
import { Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function ProjectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Client-side protection - redirect if not admin
  useEffect(() => {
    if (
      !isLoading &&
      (!user || (user.role !== "admin" && user.role !== "ADMIN"))
    ) {
      router.push("/admin/login?from=/projects");
    }
  }, [user, isLoading, router]);

  // Show nothing while loading or if not authenticated
  if (isLoading || !user || (user.role !== "admin" && user.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-3xl font-bold">Projects (Admin Only)</h1>
        </div>
        <p className="text-gray-600">
          View and manage all your construction and building projects. This page
          is restricted to administrators only.
        </p>
      </div>

      <ProjectList />
    </div>
  );
}
