import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Mark this route as dynamic but with some caching
export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every 60 seconds

// GET jobs posted by a specific user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // Add cache-control header to improve performance
    const response = new NextResponse();
    response.headers.set("Cache-Control", "public, max-age=15, s-maxage=30");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400, headers: response.headers }
      );
    }

    // Log the request to help with debugging
    console.log(`Fetching jobs for user: ${userId}`);

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
      orderBy: {
        createdAt: "desc", // Get newest jobs first
      },
      // Limit to reasonable number to improve performance
      take: 50,
    });

    console.log(`Found ${jobs.length} jobs for user: ${userId}`);

    return NextResponse.json(jobs, {
      status: 200,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Error fetching user jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch user jobs" },
      { status: 500 }
    );
  }
}
