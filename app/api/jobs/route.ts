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
    console.log("POST /api/jobs: Starting job creation");

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
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
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
      } else {
        console.log("No valid NextAuth token found");
      }
    } catch (tokenError) {
      console.error("Error extracting NextAuth token:", tokenError);
    }

    // If we couldn't get the user ID from the token, try the cookie
    if (!userId) {
      try {
        const cookieStore = cookies();
        const userCookie = cookieStore.get("user");

        if (userCookie?.value) {
          try {
            const userData = JSON.parse(decodeURIComponent(userCookie.value));
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
        } else {
          console.log("No user cookie found");
        }
      } catch (cookieError) {
        console.error("Error accessing cookies:", cookieError);
      }
    }

    // Check authorization header as a last resort
    if (!userId && request.headers.get("authorization")) {
      try {
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          // Implement your token validation logic here
          // This is just a placeholder
          console.log("Found Authorization header, attempting to validate");
        }
      } catch (authError) {
        console.error("Error processing Authorization header:", authError);
      }
    }

    // Log all request headers for debugging
    if (!userId) {
      console.log("Authentication failed. Dumping request headers:");
      request.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
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

    console.log("Request validated, creating job with data:", {
      title,
      location,
      posterId: userId,
    });

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
        metadata: metadata || {},
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

    console.log("Job created successfully:", {
      id: job.id,
      title: job.title,
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

        console.log("Confirmation email sent to", emailToUse);
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    }

    return NextResponse.json(job, { status: 201, headers });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job", message: (error as Error).message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
