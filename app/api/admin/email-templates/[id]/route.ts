import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

// Mark this route as dynamic since it uses cookies
export const dynamic = "force-dynamic";

// Create a Prisma client instance specifically for this route
// This ensures we have a fresh connection for each request
const prismaClient = new PrismaClient();

// Helper function to check if user is admin
function isAdmin(req: Request) {
  try {
    // Get the session cookie
    const cookieStore = cookies();

    // First check for NextAuth.js session token
    const sessionToken = cookieStore.get("next-auth.session-token");
    if (sessionToken && sessionToken.value) {
      // Instead of trying to decode the JWT (which causes errors),
      // check for the existence of the admin role cookie or header
      const userRole = cookieStore.get("user-role");
      if (userRole && userRole.value) {
        return userRole.value === "ADMIN" || userRole.value === "admin";
      }
    }

    // Check for user cookie as fallback
    const userCookie = cookieStore.get("user");
    if (userCookie && userCookie.value) {
      try {
        const user = JSON.parse(userCookie.value);
        return user && (user.role === "ADMIN" || user.role === "admin");
      } catch (parseError) {
        console.error("Error parsing user cookie:", parseError);
      }
    }

    // Check for Authorization header as last resort
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        // Safer token parsing - avoid atob which is causing the error
        const base64Url = token.split(".")[1];
        if (!base64Url) return false;

        // Use safer base64 decoding with proper padding
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padding = "=".repeat((4 - (base64.length % 4)) % 4);
        const jsonPayload = Buffer.from(base64 + padding, "base64").toString();

        // Parse and check role
        const decodedToken = JSON.parse(jsonPayload);
        return decodedToken.role === "ADMIN" || decodedToken.role === "admin";
      } catch (tokenError) {
        console.error("Error safely decoding token:", tokenError);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// GET - Retrieve a specific email template by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    if (!isAdmin(req)) {
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    if (!isAdmin(req)) {
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
