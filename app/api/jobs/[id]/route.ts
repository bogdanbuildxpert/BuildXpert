import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";

// GET a specific job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

// PUT (update) a job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the request
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, location, salary, type, status, metadata } =
      body;

    // Check if job exists and get the poster information
    const existingJob = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
      include: {
        poster: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if the current user is the poster or an admin
    const isJobPoster = existingJob.poster.id === currentUser.id;
    const isAdmin =
      currentUser.role === "ADMIN" || currentUser.role === "admin";

    if (!isJobPoster && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to edit this job" },
        { status: 403 }
      );
    }

    // Check if status is being changed and if the user is an admin
    if (status && status !== existingJob.status && !isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can change job status" },
        { status: 403 }
      );
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: {
        id: params.id,
      },
      data: {
        title: title || undefined,
        description: description || undefined,
        location: location || undefined,
        salary: salary ? parseFloat(salary) : undefined,
        type: type || undefined,
        status: status || undefined,
        metadata: metadata || undefined,
      } as any,
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the request
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if job exists and get the poster information
    const existingJob = await prisma.job.findUnique({
      where: {
        id: params.id,
      },
      include: {
        poster: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if the current user is the poster or an admin
    const isJobPoster = existingJob.poster.id === currentUser.id;
    const isAdmin =
      currentUser.role === "ADMIN" || currentUser.role === "admin";

    if (!isJobPoster && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this job" },
        { status: 403 }
      );
    }

    // Delete the job
    await prisma.job.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
