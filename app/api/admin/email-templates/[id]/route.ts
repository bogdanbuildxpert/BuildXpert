import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// Mark this route as dynamic since it uses cookies
export const dynamic = "force-dynamic";

// Helper function to check if user is admin
function isAdmin(req: Request) {
  try {
    // Get the session cookie
    const cookieStore = cookies();
    const userCookie = cookieStore.get("user");

    if (!userCookie || !userCookie.value) {
      // Check for Authorization header as fallback
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const decodedToken = JSON.parse(atob(token.split(".")[1]));
          return decodedToken.role === "ADMIN";
        } catch (error) {
          console.error("Error decoding token:", error);
          return false;
        }
      }
      return false;
    }

    // Parse the user cookie
    const user = JSON.parse(userCookie.value);
    return user && (user.role === "ADMIN" || user.role === "admin");
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

    // Get the email template
    const template = await prisma.emailTemplate.findUnique({
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

    // Update the email template
    const updatedTemplate = await prisma.emailTemplate.update({
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
  }
}
