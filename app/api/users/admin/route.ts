import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Since this is an admin-only API, make it dynamic
export const dynamic = "force-dynamic";

// GET endpoint to find an admin user
export async function GET() {
  try {
    // Always use the real database connection
    console.log("Finding admin user from database");

    // Find the first admin user
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 404 }
      );
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("Error finding admin user:", error);
    return NextResponse.json(
      { error: "Failed to find admin user" },
      { status: 500 }
    );
  }
}
