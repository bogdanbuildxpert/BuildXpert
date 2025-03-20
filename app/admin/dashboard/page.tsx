"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bell,
  Calendar,
  Home,
  Settings,
  Users,
  Mail,
} from "lucide-react";

// Sample data for the dashboard
const stats = [
  {
    title: "Total Jobs",
    value: "124",
    change: "+12% from last month",
  },
  {
    title: "Active Jobs",
    value: "45",
    change: "+5% from last month",
  },
  {
    title: "New Users",
    value: "32",
    change: "+18% from last month",
  },
  {
    title: "Revenue",
    value: "€24,500",
    change: "+8% from last month",
  },
];

const recentJobs = [
  {
    id: 1,
    title: "Interior Painting - Office Building",
    client: "ABC Corporation",
    status: "In Progress",
    date: "2023-05-15",
  },
  {
    id: 2,
    title: "Exterior Facade Restoration",
    client: "Heritage Properties",
    status: "Pending",
    date: "2023-05-12",
  },
  {
    id: 3,
    title: "Commercial Space Repainting",
    client: "Retail Solutions Ltd",
    status: "Completed",
    date: "2023-05-10",
  },
  {
    id: 4,
    title: "Residential Complex - Common Areas",
    client: "City Apartments",
    status: "In Progress",
    date: "2023-05-08",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col border-r border-border bg-background p-4 md:flex">
        <div className="mb-8 flex items-center space-x-2">
          <span className="text-xl font-bold">BuildXpert Admin</span>
        </div>
        <nav className="flex flex-1 flex-col space-y-1">
          <Button variant="ghost" className="justify-start" asChild>
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/admin/jobs" className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Jobs</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/admin/users" className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link
              href="/admin/contacts"
              className="flex items-center space-x-2"
            >
              <Mail className="h-5 w-5" />
              <span>Contact Forms</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link
              href="/admin/email-templates"
              className="flex items-center space-x-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M21 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
                <path d="M3 8h18" />
                <path d="M9 12h9.5" />
                <path d="M9 16h9.5" />
                <path d="M9 20h5" />
              </svg>
              <span>Email Templates</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link
              href="/admin/analytics"
              className="flex items-center space-x-2"
            >
              <BarChart className="h-5 w-5" />
              <span>Analytics</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link
              href="/admin/settings"
              className="flex items-center space-x-2"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary">
              <span className="sr-only">User profile</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Jobs</CardTitle>
                  <CardDescription>
                    Overview of the latest job postings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.client}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${
                              job.status === "Completed"
                                ? "text-green-600"
                                : job.status === "In Progress"
                                ? "text-blue-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {job.status}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {job.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Management</CardTitle>
                  <CardDescription>
                    Manage all job postings and applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Job management content would go here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    User management content would go here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    View detailed analytics and reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Analytics content would go here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
