import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { compare } from "bcrypt";
import { getToken } from "next-auth/jwt";

// Mark this route as dynamic since it uses cookies
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, confirmText, email } = body;

    // Validate confirmation text
    if (confirmText !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm account deletion" },
        { status: 400 }
      );
    }

    console.log("Starting account deletion process");

    // Try to get user from NextAuth token first
    let userId = null;
    let userEmail = null;

    // Try to get token from NextAuth
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log("NextAuth token:", token ? "Found" : "Not found");

    if (token && token.email) {
      // If we have a NextAuth token with email, use that
      userEmail = token.email as string;
      console.log("Using email from NextAuth token:", userEmail);
    } else if (email) {
      // If email was provided in the request, use that
      userEmail = email;
      console.log("Using email from request body:", userEmail);
    } else {
      // Fall back to user cookie
      const userCookie = cookies().get("user")?.value;

      if (!userCookie) {
        console.log("No user cookie found");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const userData = JSON.parse(userCookie);
        userId = userData.id;
        userEmail = userData.email;
        console.log("Using data from user cookie, email:", userEmail);
      } catch (error) {
        console.log("Error parsing user cookie:", error);
        return NextResponse.json(
          { error: "Invalid user data" },
          { status: 401 }
        );
      }
    }

    // Find user by email or id
    let user;
    if (userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
      });
      console.log("Looking up user by email:", userEmail);
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
      console.log("Looking up user by ID:", userId);
    }

    if (!user) {
      console.log("User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found:", user.id, user.email);

    // Check if user is a Google user (empty or null password)
    const isGoogleAccount = !user.password || user.password === "";
    console.log("Is Google account:", isGoogleAccount);

    // For Google users, we skip password verification
    // For regular users, verify password
    if (!isGoogleAccount) {
      // Only verify password for non-Google accounts
      if (!password) {
        return NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        );
      }

      const isPasswordValid = await compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Password is incorrect" },
          { status: 400 }
        );
      }
    }

    console.log("Starting database transaction to delete user data");

    // Begin transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // 1. Delete user's messages
      await tx.message.deleteMany({
        where: {
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
      });

      // 2. Delete user's reviews
      await tx.review.deleteMany({
        where: {
          OR: [{ authorId: user.id }, { receiverId: user.id }],
        },
      });

      // 3. Delete user's services
      await tx.service.deleteMany({
        where: { providerId: user.id },
      });

      // 4. Delete materials from user's projects
      const userProjects = await tx.project.findMany({
        where: { clientId: user.id },
        select: { id: true },
      });

      const projectIds = userProjects.map((project) => project.id);

      await tx.material.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      // 5. Delete tasks from user's projects
      await tx.task.deleteMany({
        where: { projectId: { in: projectIds } },
      });

      // 6. Delete user's projects
      await tx.project.deleteMany({
        where: { clientId: user.id },
      });

      // 7. Remove user from job applications
      // Find jobs where user is an applicant
      const jobsWithUser = await tx.job.findMany({
        where: {
          applicants: {
            some: { id: user.id },
          },
        },
        select: { id: true },
      });

      // Update each job to remove the user from applicants
      for (const job of jobsWithUser) {
        await tx.job.update({
          where: { id: job.id },
          data: {
            applicants: {
              disconnect: { id: user.id },
            },
          },
        });
      }

      // 8. Delete jobs posted by user
      await tx.job.deleteMany({
        where: { posterId: user.id },
      });

      // 9. Finally, delete the user
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    console.log("User data deleted, clearing cookies");

    // Clear user cookie
    cookies().delete("user");

    // Clear all NextAuth session cookies
    cookies().delete("next-auth.session-token");
    cookies().delete("next-auth.callback-url");
    cookies().delete("next-auth.csrf-token");

    // Try to clear cookies with different options to ensure they're removed
    // in all possible configurations
    try {
      // Clear cookies in root path
      const cookieStore = cookies();
      cookieStore.set("next-auth.session-token", "", { maxAge: 0, path: "/" });
      cookieStore.set("next-auth.callback-url", "", { maxAge: 0, path: "/" });
      cookieStore.set("next-auth.csrf-token", "", { maxAge: 0, path: "/" });

      // Set expired cookies for production domain
      if (process.env.NODE_ENV === "production") {
        cookieStore.set("next-auth.session-token", "", {
          maxAge: 0,
          path: "/",
          domain: ".buildxpert.ie",
        });
        cookieStore.set("next-auth.callback-url", "", {
          maxAge: 0,
          path: "/",
          domain: ".buildxpert.ie",
        });
        cookieStore.set("next-auth.csrf-token", "", {
          maxAge: 0,
          path: "/",
          domain: ".buildxpert.ie",
        });
      }
    } catch (cookieError) {
      console.error("Error clearing additional cookies:", cookieError);
      // Continue with the response even if there's an error clearing cookies
    }

    console.log("Account deletion completed successfully");

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 }
    );
  }
}
