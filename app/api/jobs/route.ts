import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { Prisma, ProjectStatus, JobStatus } from "@prisma/client";
import { getProcessedTemplate, transporter } from "@/lib/email";

// Define a type that has all the fields needed after job creation
type JobWithPoster = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  poster: {
    id: string;
    name: string | null;
    email: string;
  };
  [key: string]: any;
};

// Mark this route as dynamic since it uses cookies
export const dynamic = "force-dynamic";

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
    } catch {
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

    const { title, description, location, metadata } = body;

    // Use the user ID from the cookie instead of the one from the request
    const posterId = userData.id;

    // Create the job with proper typing
    const job = (await prisma.job.create({
      data: {
        title,
        description,
        location,
        status: "PLANNING",
        posterId,
        metadata: metadata,
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
    })) as unknown as JobWithPoster;

    // Send job posting confirmation email
    if (job.poster && job.poster.email) {
      try {
        const jobLink = `${
          process.env.APP_URL || "http://localhost:3000"
        }/jobs/${job.id}`;

        // Get email template
        const { subject, content } = await getProcessedTemplate(
          "job_posted_confirmation",
          {
            name: job.poster.name || job.poster.email.split("@")[0],
            jobTitle: job.title,
            location: job.location || "Not specified",
            postedDate: new Date().toLocaleDateString(),
            dashboardLink: jobLink,
          }
        );

        // Send the email
        await transporter.sendMail({
          from: {
            name: process.env.EMAIL_FROM_NAME || "BuildXpert",
            address: process.env.EMAIL_SERVER_USER || "",
          },
          to: job.poster.email,
          subject,
          html: content,
        });

        console.log(
          `Job posting confirmation email sent to ${job.poster.email}`
        );
      } catch (emailError) {
        // Log error but don't fail the request
        console.error(
          "Error sending job posting confirmation email:",
          emailError
        );
      }
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
