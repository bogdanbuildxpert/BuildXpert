import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Mark this route as dynamic
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Prisma debug route called");

    // Create a direct instance with debug logging
    const prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });

    console.log("PrismaClient instance created");

    // Try to connect
    console.log("Attempting to connect to database...");
    await prisma.$connect();
    console.log("Successfully connected to database");

    // Test a simple query
    console.log("Attempting to run a simple query...");
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database`);

    // Test contact table
    console.log("Attempting to access contact table...");
    const contactCount = await prisma.contact.count();
    console.log(`Found ${contactCount} contacts in database`);

    return NextResponse.json({
      status: "success",
      message: "Prisma connection working",
      userCount,
      contactCount,
      clientInitialized: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Prisma diagnostic error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    // Always disconnect to clean up
    try {
      const prisma = new PrismaClient();
      await prisma.$disconnect();
      console.log("Prisma client disconnected");
    } catch (e) {
      console.error("Error disconnecting prisma client:", e);
    }
  }
}
