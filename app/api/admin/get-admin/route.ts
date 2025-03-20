import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/**
 * API endpoint to get an admin user ID for messaging
 * This is more reliable than the generic users/admin endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Finding admin for user:", currentUser.id);

    // Find the most recently active admin based on login time or message activity
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        // Don't return the requesting user if they're an admin
        NOT: {
          id: currentUser.id,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        // Order by creation date as a proxy for activity
        createdAt: "desc",
      },
    });

    if (!admin) {
      // Fallback to any admin if no recently active ones are found
      const fallbackAdmin = await prisma.user.findFirst({
        where: {
          role: "ADMIN",
          NOT: {
            id: currentUser.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (!fallbackAdmin) {
        return NextResponse.json(
          { error: "No admin users available" },
          { status: 404 }
        );
      }

      return NextResponse.json({ adminId: fallbackAdmin.id });
    }

    return NextResponse.json({ adminId: admin.id });
  } catch (error) {
    console.error("Error finding admin for messaging:", error);
    return NextResponse.json(
      { error: "Failed to find an admin" },
      { status: 500 }
    );
  }
}
