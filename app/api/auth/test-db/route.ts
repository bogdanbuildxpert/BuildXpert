import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Testing database connection...");
    console.log(
      "Database URL:",
      process.env.DATABASE_URL?.substring(0, 20) + "..."
    );

    // Test database connection by running a simple query
    let connectionStatus = "Not tested";
    let userCount = -1;
    let error = null;

    try {
      // Test if we can connect to the database
      await prisma.$connect();
      connectionStatus = "Connected";

      // Try a simple query
      userCount = await prisma.user.count();

      console.log("Database connection successful, user count:", userCount);
    } catch (dbError) {
      connectionStatus = "Error";
      error = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("Database connection error:", error);
    } finally {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error("Error disconnecting from database:", disconnectError);
      }
    }

    // Get database connection info from environment variables
    const databaseInfo = {
      // Only show partial connection string for security
      url: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL.split("://")[0]}://${
            process.env.DATABASE_URL.split("@")[1]?.split("/")[0] || "***"
          }/***`
        : "Not set",
      directUrl: process.env.DIRECT_URL
        ? `${process.env.DIRECT_URL.split("://")[0]}://${
            process.env.DIRECT_URL.split("@")[1]?.split("/")[0] || "***"
          }/***`
        : "Not set",
      postgresHost: process.env.POSTGRES_HOST || "Not set",
      postgresPort: process.env.POSTGRES_PORT || "Not set",
      postgresDb: process.env.POSTGRES_DB || "Not set",
      postgresUser: process.env.POSTGRES_USER ? "Set (hidden)" : "Not set",
      isStatic:
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.VERCEL_ENV === "production" ||
        (process.env.NODE_ENV === "production" && process.env.VERCEL) ||
        false,
    };

    return NextResponse.json({
      status: "ok",
      database: {
        connection: connectionStatus,
        userCount,
        error,
        config: databaseInfo,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || "Not set",
        VERCEL_ENV: process.env.VERCEL_ENV || "Not set",
        VERCEL: process.env.VERCEL || "Not set",
        NEXT_PHASE: process.env.NEXT_PHASE || "Not set",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to test database connection:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to test database connection",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
