import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { markMessagesAsRead } from "@/lib/pg-notify";

// POST to mark messages as read
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");
    const userId = searchParams.get("userId");

    if (!jobId || !userId) {
      return NextResponse.json(
        { error: "Job ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Mark messages as read using PostgreSQL function
    const success = await markMessagesAsRead(jobId, userId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to mark messages as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
