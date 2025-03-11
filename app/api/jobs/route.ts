import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// GET all jobs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    let whereClause = {};
    if (status) {
      whereClause = {
        status: status.toUpperCase(),
      };
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
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
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST a new job
export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const userCookie = cookies().get("user")?.value;

    if (!userCookie) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to post a job." },
        { status: 401 }
      );
    }

    let userData;
    try {
      userData = JSON.parse(userCookie);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid user data. Please log in again." },
        { status: 401 }
      );
    }

    if (!userData.id) {
      return NextResponse.json(
        { error: "Invalid user data. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { title, description, location, salary, type, metadata } = body;

    // Use the user ID from the cookie instead of the one from the request
    const posterId = userData.id;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        salary: salary ? parseFloat(salary) : null,
        type: type || "FULL_TIME",
        posterId,
        ...(metadata ? { metadata } : {}),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
