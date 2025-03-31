import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

// Create a fresh Prisma client for this API route
const prisma = new PrismaClient();

// Mark this route as dynamic since it uses authentication
export const dynamic = "force-dynamic";

// DELETE endpoint to remove a contact form submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try multiple authentication methods
    let isAuthenticated = false;
    let isAdmin = false;
    let authMethod = "";

    // 1. Check NextAuth token
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
        cookieName: "next-auth.session-token",
      });

      if (token) {
        isAuthenticated = true;
        authMethod = "nextauth";
        // Check if user has admin role
        const userRole = token.role as string;
        if (userRole === "ADMIN" || userRole === "admin") {
          isAdmin = true;
        }
      }
    } catch (tokenError) {
      console.error("Error checking NextAuth token:", tokenError);
    }

    // 2. Check Authorization header
    if (!isAuthenticated) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        isAuthenticated = true;
        authMethod = "authorization_header";
        // We assume this is coming from an admin since it's using the admin API
        isAdmin = true;
      }
    }

    // 3. Check X-User-Data header (custom header with user cookie data)
    if (!isAuthenticated) {
      const userDataHeader = request.headers.get("x-user-data");
      if (userDataHeader) {
        try {
          const userData = JSON.parse(userDataHeader);
          if (userData?.role === "ADMIN" || userData?.role === "admin") {
            isAuthenticated = true;
            authMethod = "x_user_data";
            isAdmin = true;
          }
        } catch (e) {
          console.error("Error parsing X-User-Data header:", e);
        }
      }
    }

    // 4. Check user cookie as fallback
    if (!isAuthenticated) {
      const cookieStore = cookies();
      const userCookie = cookieStore.get("user");

      if (userCookie?.value) {
        try {
          const userData = JSON.parse(userCookie.value);
          if (userData?.role === "ADMIN" || userData?.role === "admin") {
            isAuthenticated = true;
            authMethod = "user_cookie";
            isAdmin = true;
          }
        } catch (e) {
          console.error("Error parsing user cookie:", e);
        }
      }
    }

    // Log authentication status after trying all methods
    console.log("Authentication status for DELETE contact:", {
      isAuthenticated,
      isAdmin,
      authMethod,
    });

    // Check authentication status
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
    }

    // Check admin status
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Delete the contact with more detailed error handling
    try {
      await prisma.contact.delete({
        where: { id },
      });
    } catch (deleteError) {
      console.error("Prisma delete error:", deleteError);
      if (deleteError instanceof Error) {
        return NextResponse.json(
          { error: `Database error: ${deleteError.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Failed to delete from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);

    // More detailed error information
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
