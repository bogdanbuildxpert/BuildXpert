import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

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
    const body = await request.json();

    const { title, description, location, salary, type, posterId, metadata } =
      body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        salary: salary ? parseFloat(salary) : null,
        type: type || "FULL_TIME",
        posterId,
        metadata,
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
