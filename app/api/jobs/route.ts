import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { Prisma, ProjectStatus, JobStatus } from "@prisma/client";
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
    console.log("Job POST request received");

    // Verify user authentication - try multiple methods for better reliability
    let userId = null;
    let userName = null;
    let userEmail = null;

    // First try to get the user from the cookie
    const userCookie = cookies().get("user")?.value;
    console.log("User cookie presence:", userCookie ? "Found" : "Not found");

    if (userCookie) {
      try {
        // Decode the user cookie value in case it was encoded
        const decodedCookie = decodeURIComponent(userCookie);
        console.log(
          "Decoded cookie (partial):",
          decodedCookie.substring(0, 50) + "..."
        );

        const userData = JSON.parse(decodedCookie);
        if (userData?.id) {
          userId = userData.id;
          userName = userData.name;
          userEmail = userData.email;
          console.log("User authenticated from cookie:", {
            id: userId,
            name: userName || "(not set)",
            email: userEmail || "(not set)",
          });
        } else {
          console.error(
            "User cookie exists but doesn't contain an ID:",
            userData
          );
        }
      } catch (err) {
        console.error("Failed to parse user cookie:", err);
      }
    }

    // If we couldn't get the user ID from the cookie, try to use Next-Auth session
    if (!userId) {
      console.log("Attempting to use Next-Auth session as fallback");

      try {
        // Get the token from the request
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });

        console.log("NextAuth token:", token ? "Found" : "Not found");
        if (token) {
          console.log("Token content:", JSON.stringify(token));
        }

        if (token && token.sub) {
          userId = token.sub;
          userName = (token.name as string) || null;
          userEmail = (token.email as string) || null;

          console.log("User authenticated from NextAuth token:", {
            id: userId,
            name: userName || "(not set)",
            email: userEmail || "(not set)",
          });
        } else {
          console.error(
            "NextAuth token exists but doesn't contain user data:",
            token
          );
        }
      } catch (err) {
        console.error("Failed to get NextAuth token:", err);
      }
    }

    // If we still couldn't get the user ID, check for auth headers
    if (!userId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        console.log("Found Authorization header, attempting to validate");
        // You could validate the token here if needed
      } else {
        console.log("No Authorization header found");
      }
    }

    // If we still couldn't get the user ID, fail the request
    if (!userId) {
      console.error("No valid user ID found from cookie or NextAuth");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to post a job." },
        { status: 401 }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
      console.log("Received job data:", {
        title: body?.title,
        location: body?.location,
      });
    } catch (err) {
      console.error("Failed to parse request body:", err);
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const { title, description, location, metadata } = body;

    if (!title || !description || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the job with proper typing and error handling
    try {
      const job = (await prisma.job.create({
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
      })) as unknown as JobWithPoster;

      console.log("Job created successfully:", {
        id: job.id,
        title: job.title,
        posterId: job.poster?.id,
      });

      // Send job posting confirmation email if we have the email
      const emailToUse = job.poster?.email || userEmail;
      const nameToUse =
        job.poster?.name || userName || emailToUse?.split("@")[0];

      if (emailToUse) {
        try {
          const jobLink = `${
            process.env.APP_URL || "http://localhost:3000"
          }/jobs/${job.id}`;

          // Get email template
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

          // Send the email
          await transporter.sendMail({
            from: {
              name: process.env.EMAIL_FROM_NAME || "BuildXpert",
              address: process.env.EMAIL_SERVER_USER || "",
            },
            to: emailToUse,
            subject,
            html: content,
          });

          console.log(`Job posting confirmation email sent to ${emailToUse}`);
        } catch (emailError) {
          // Log error but don't fail the request
          console.error(
            "Error sending job posting confirmation email:",
            emailError
          );
        }
      }

      return NextResponse.json(job, { status: 201 });
    } catch (dbError) {
      console.error("Database error creating job:", dbError);
      return NextResponse.json(
        { error: "Failed to create job in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
