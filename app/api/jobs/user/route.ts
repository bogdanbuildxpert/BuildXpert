import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET jobs posted by a specific user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const jobs = await prisma.job.findMany({
      where: {
        posterId: userId,
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

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching user jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch user jobs" },
      { status: 500 }
    );
  }
}
