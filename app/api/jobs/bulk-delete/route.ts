import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";
import { deleteImage } from "@/lib/supabase-client";

// Helper function to extract file path from Supabase URL
async function deleteImageFromUrl(imageUrl: string) {
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

// POST handler for bulk job deletion
export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admins can perform bulk deletion
    if (user.role !== "ADMIN" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can perform bulk deletion" },
        { status: 403 }
      );
    }

    // Get array of job IDs from request
    const { jobIds, deleteAll } = await request.json();

    // For safety, limit the number of jobs that can be deleted at once
    if (
      !deleteAll &&
      (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0)
    ) {
      return NextResponse.json(
        { error: "No job IDs provided for deletion" },
        { status: 400 }
      );
    }

    // Fetch jobs to get their images before deletion
    let jobsToDelete;

    if (deleteAll) {
      // Get all jobs with their metadata if deleteAll is true
      jobsToDelete = await prisma.job.findMany({
        select: {
          id: true,
          metadata: true,
        },
      });
    } else {
      // Get only specified jobs with their metadata
      jobsToDelete = await prisma.job.findMany({
        where: {
          id: {
            in: jobIds,
          },
        },
        select: {
          id: true,
          metadata: true,
        },
      });
    }

    // Process image deletion for all jobs
    for (const job of jobsToDelete) {
      if (job.metadata && typeof job.metadata === "object") {
        const metadata = job.metadata as Record<string, unknown>;
        if (metadata.images && Array.isArray(metadata.images)) {
          // Delete each image in parallel for this job
          const imageDeletePromises = metadata.images.map((imageUrl: string) =>
            deleteImageFromUrl(imageUrl)
          );

          // Wait for all image deletions to complete for this job
          await Promise.all(imageDeletePromises);
        }
      }
    }

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      let deleteCount = 0;

      if (deleteAll) {
        // First, delete all messages in the system
        await tx.message.deleteMany({});

        // Then delete all jobs
        const jobResult = await tx.job.deleteMany({});
        deleteCount = jobResult.count;
      } else {
        // Delete messages for the specific jobs first
        await tx.message.deleteMany({
          where: {
            jobId: {
              in: jobIds,
            },
          },
        });

        // Then delete the specific jobs
        const jobResult = await tx.job.deleteMany({
          where: {
            id: {
              in: jobIds,
            },
          },
        });
        deleteCount = jobResult.count;
      }

      return { count: deleteCount };
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} jobs and their associated images`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error in bulk job deletion:", error);
    return NextResponse.json(
      { error: "Failed to delete jobs" },
      { status: 500 }
    );
  }
}
