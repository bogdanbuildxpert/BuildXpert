import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { Prisma, ProjectStatus } from "@prisma/client";
import { getProcessedTemplate, transporter } from "@/lib/email";
import { getToken } from "next-auth/jwt";

// Mark this route as dynamic to ensure it's always evaluated at runtime
export const dynamic = "force-dynamic";

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
    // Add proper caching headers
    const headers = new Headers({
      "Cache-Control": "no-store, must-revalidate",
      Pragma: "no-cache",
    });

    // Verify user authentication - try multiple methods for better reliability
    let userId = null;
    let userName = null;
    let userEmail = null;
    let authMethod = null;

    // First try to get the token from NextAuth
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token?.sub) {
      userId = token.sub;
      userName = (token.name as string) || null;
      userEmail = (token.email as string) || null;
      authMethod = "nextauth";
      console.log("User authenticated via NextAuth token:", {
        userId,
        userEmail,
      });
    }

    // If we couldn't get the user ID from the token, try the cookie
    if (!userId) {
      const userCookie = cookies().get("user")?.value;

      if (userCookie) {
        try {
          const userData = JSON.parse(decodeURIComponent(userCookie));
          if (userData?.id) {
            userId = userData.id;
            userName = userData.name;
            userEmail = userData.email;
            authMethod = "cookie";
            console.log("User authenticated via cookie:", {
              userId,
              userEmail,
            });
          }
        } catch (err) {
          console.error("Failed to parse user cookie:", err);
        }
      }
    }

    // If we still couldn't get the user ID, fail the request
    if (!userId) {
      console.error("Authentication failed - no valid token or cookie found");
      return NextResponse.json(
        {
          error: "Unauthorized. Please log in to post a job.",
          details:
            "Your session may have expired. Please try logging out and logging back in.",
        },
        { status: 401, headers }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { title, description, location, metadata } = body;

    if (!title || !description || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        status: "PLANNING",
        posterId: userId,
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
    });

    // Send email notification if we have the email
    const emailToUse = job.poster?.email || userEmail;
    const nameToUse = job.poster?.name || userName || emailToUse?.split("@")[0];

    if (emailToUse) {
      try {
        const jobLink = `${
          process.env.APP_URL || "http://localhost:3000"
        }/jobs/${job.id}`;
        const { subject, content } = await getProcessedTemplate(
          "job_posted_confirmation",
          {
            name: nameToUse,
            jobTitle: job.title,
            location: job.location || "Not specified",
            postedDate: new Date().toLocaleDateString(),
            dashboardLink: jobLink,
          }
        );

        await transporter.sendMail({
          from: {
            name: process.env.EMAIL_FROM_NAME || "BuildXpert",
            address: process.env.EMAIL_SERVER_USER || "",
          },
          to: emailToUse,
          subject,
          html: content,
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    }

    return NextResponse.json(job, { status: 201, headers });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
