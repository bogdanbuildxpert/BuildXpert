import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

// Mark this route as dynamic since it uses authentication
export const dynamic = "force-dynamic";

// Create a Prisma client instance specifically for this route
// This ensures we have a fresh connection for each request
const prismaClient = new PrismaClient();

// Helper function to check if user is admin
async function isAdmin(req: NextRequest): Promise<boolean> {
  try {
    // Log headers for debugging
    console.log("Email templates - Auth headers:", {
      authHeader: req.headers.get("authorization"),
      cookieHeader: req.headers.get("cookie")?.substring(0, 100) + "...", // Truncate for log clarity
    });

    // Get the NextAuth token with explicit options
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: "next-auth.session-token",
    });

    // Debug log
    if (token) {
      console.log("Token found:", {
        id: token.sub,
        email: token.email,
        role: token.role,
      });
    } else {
      console.log("No valid token found in request");
    }

    // Check if token exists and has admin role
    return !!token && (token.role === "ADMIN" || token.role === "admin");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// GET - Retrieve all email templates
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Use the dedicated prisma client to ensure connection
    const templates = await prismaClient.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  } finally {
    // Disconnect the client to prevent connection pool exhaustion
    await prismaClient.$disconnect().catch(console.error);
  }
}

// POST - Update an email template
export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id, subject, content } = await req.json();

    // Validate required fields
    if (!id || !subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use the dedicated prisma client to ensure connection
    const updatedTemplate = await prismaClient.emailTemplate.update({
      where: { id },
      data: {
        subject,
        content,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Error updating email template:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  } finally {
    // Disconnect the client to prevent connection pool exhaustion
    await prismaClient.$disconnect().catch(console.error);
  }
}
