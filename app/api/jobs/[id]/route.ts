import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import { getProcessedTemplate, transporter } from "@/lib/email";
import { deleteImage } from "@/lib/supabase-client";

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
            role: true,
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
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, location, status, metadata } = body;

    // Verify the job exists and user has permission to edit
    const existingJob = await prisma.job.findUnique({
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

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if the user is the job poster or an admin
    if (
      existingJob.poster.id !== user.id &&
      user.role !== "ADMIN" &&
      user.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Unauthorized. You can only edit your own jobs." },
        { status: 403 }
      );
    }

    // Check if status is changing
    const isStatusChanging = status && status !== existingJob.status;

    // Update the job
    const updatedJob = await prisma.job.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        description,
        location,
        status: status || undefined,
        metadata: metadata || undefined,
      },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send email notification if status is changing
    if (isStatusChanging && existingJob.poster.email) {
      try {
        // Format the status for display
        const formattedStatus = status.replace("_", " ").toLowerCase();
        const jobLink = `${
          process.env.APP_URL || "http://localhost:3000"
        }/jobs/${params.id}`;

        // Get email template
        const { subject, content } = await getProcessedTemplate(
          "job_status_update",
          {
            name:
              existingJob.poster.name || existingJob.poster.email.split("@")[0],
            jobTitle: updatedJob.title,
            newStatus: formattedStatus,
            jobLink,
          }
        );

        // Send the email
        await transporter.sendMail({
          from: {
            name: process.env.EMAIL_FROM_NAME || "BuildXpert",
            address: process.env.EMAIL_SERVER_USER || "",
          },
          to: existingJob.poster.email,
          subject,
          html: content,
        });

        console.log(`Status update email sent to ${existingJob.poster.email}`);
      } catch (emailError) {
        // Log error but don't fail the request
        console.error("Error sending status update email:", emailError);
      }
    }

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
    const user = await getUserFromRequest(request);

    if (!user) {
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
            role: true,
          },
        },
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if the current user is the poster or an admin
    const isJobPoster = existingJob.poster.id === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "admin";

    if (!isJobPoster && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this job" },
        { status: 403 }
      );
    }

    // Delete any associated images from Supabase
    if (existingJob.metadata && typeof existingJob.metadata === "object") {
      const metadata = existingJob.metadata as Record<string, unknown>;
      if (metadata.images && Array.isArray(metadata.images)) {
        // Process image deletion in parallel
        const imageDeletePromises = metadata.images.map(
          async (imageUrl: string) => {
            try {
              // Check if we have a valid URL
              if (!imageUrl || typeof imageUrl !== "string") {
                console.log(`Skipping invalid image URL: ${imageUrl}`);
                return;
              }

              console.log(`Processing image URL: ${imageUrl}`);

              // Extract the file path from the URL using URL parsing
              try {
                const url = new URL(imageUrl);
                const pathSegments = url.pathname.split("/");

                // URL format: /storage/v1/object/public/{bucketName}/{filePath}
                if (
                  pathSegments.length >= 6 &&
                  pathSegments[1] === "storage" &&
                  pathSegments[4] === "public"
                ) {
                  const bucket = pathSegments[5];
                  const path = pathSegments.slice(6).join("/");

                  console.log(`Deleting image: bucket=${bucket}, path=${path}`);
                  await deleteImage(path, bucket);
                } else {
                  console.log(`URL format not recognized: ${imageUrl}`);
                }
              } catch (urlError) {
                console.error(`Failed to parse URL ${imageUrl}:`, urlError);
              }
            } catch (imageError) {
              console.error(`Failed to delete image ${imageUrl}:`, imageError);
              // Continue with deletion even if image deletion fails
            }
          }
        );

        // Wait for all image deletions to complete
        await Promise.all(imageDeletePromises);
      }
    }

    // Use a transaction to delete the job and all related records
    await prisma.$transaction(async (tx) => {
      // Delete the job itself
      await tx.job.delete({
        where: {
          id: params.id,
        },
      });
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
