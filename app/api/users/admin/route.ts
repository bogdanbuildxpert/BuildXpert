import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Since this is an admin-only API, make it dynamic
export const dynamic = "force-dynamic";

// GET endpoint to find an admin user
export async function GET() {
  try {
    // Check if we're in a build or static export context
    const isStaticBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.VERCEL_ENV === "production" ||
      (process.env.NODE_ENV === "production" && process.env.VERCEL);

    // During static builds, return a mock admin user
    if (isStaticBuild) {
      console.log(
        "Static build detected in /api/users/admin - returning mock data"
      );
      return NextResponse.json({
        id: "static-admin-id",
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
      });
    }

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
