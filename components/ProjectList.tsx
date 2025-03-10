"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  client?: {
    id: string;
    name: string | null;
    email: string;
  };
  tasks?: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError("Error loading projects. Please try again later.");
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "ON_HOLD":
        return "bg-orange-100 text-orange-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (projects.length === 0) {
    return <div className="text-center p-8">No projects found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {projects.map((project) => (
        <Card key={project.id} className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace("_", " ")}
              </Badge>
            </div>
            <CardDescription>
              {project.location && (
                <div className="mt-1">📍 {project.location}</div>
              )}
              {project.client?.name && (
                <div className="mt-1">👤 Client: {project.client.name}</div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-600 mb-4">{project.description}</p>

            {project.budget && (
              <div className="mb-2">
                <span className="font-semibold">Budget:</span> $
                {project.budget.toLocaleString()}
              </div>
            )}

            {project.startDate && (
              <div className="mb-2">
                <span className="font-semibold">Start Date:</span>{" "}
                {new Date(project.startDate).toLocaleDateString()}
              </div>
            )}

            {project.endDate && (
              <div className="mb-2">
                <span className="font-semibold">End Date:</span>{" "}
                {new Date(project.endDate).toLocaleDateString()}
              </div>
            )}

            {project.tasks && project.tasks.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Tasks:</h4>
                <ul className="list-disc list-inside text-sm">
                  {project.tasks.slice(0, 3).map((task) => (
                    <li key={task.id} className="mb-1">
                      {task.title}{" "}
                      <Badge variant="outline" className="ml-1 text-xs">
                        {task.status}
                      </Badge>
                    </li>
                  ))}
                  {project.tasks.length > 3 && (
                    <li className="text-sm text-gray-500">
                      +{project.tasks.length - 3} more tasks
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <div className="text-xs text-gray-500">
              Created{" "}
              {formatDistance(new Date(project.createdAt), new Date(), {
                addSuffix: true,
              })}
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
