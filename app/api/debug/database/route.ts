import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get environment information
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "**exists**" : "**missing**",
      EMAIL_SERVER: process.env.EMAIL_SERVER ? "**exists**" : "**missing**",
      EMAIL_FROM: process.env.EMAIL_FROM ? "**exists**" : "**missing**",
    };

    // Test database connection with timeout
    let dbStatus: {
      connected: boolean;
      userCount: number | null;
      error: string | null;
      queryTime: number | null;
    } = {
      connected: false,
      userCount: null,
      error: null,
      queryTime: null,
    };

    const dbStart = Date.now();
    try {
      // Simple query to test connection
      const userCount = await Promise.race([
        prisma.user.count(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Database query timeout after 5000ms")),
            5000
          )
        ),
      ]);

      dbStatus.connected = true;
      dbStatus.userCount = userCount;
      dbStatus.queryTime = Date.now() - dbStart;
    } catch (error) {
      dbStatus.error = error instanceof Error ? error.message : String(error);
      dbStatus.queryTime = Date.now() - dbStart;
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        serverInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          env,
        },
        database: dbStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Debug database endpoint error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
