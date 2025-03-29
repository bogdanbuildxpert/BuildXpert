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
    // Get the NextAuth token directly
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if token exists and has admin role
    return !!token && (token.role === "ADMIN" || token.role === "admin");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// GET - Retrieve a specific email template by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the email template using the dedicated client
    const template = await prismaClient.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Email template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 }
    );
  } finally {
    // Disconnect the client to prevent connection pool exhaustion
    await prismaClient.$disconnect().catch(console.error);
  }
}

// PATCH - Update a specific email template
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { subject, content } = await req.json();

    // Validate required fields
    if (!subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the email template using the dedicated client
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
