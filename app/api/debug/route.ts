import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity by querying for user count
    const userCount = await prisma.user.count();

    // Get environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      // Database info (masked)
      dbInfo: {
        hasDBURL: !!process.env.DATABASE_URL,
        hasDirectURL: !!process.env.DIRECT_URL,
      },
    };

    return NextResponse.json({
      status: "success",
      database: {
        connected: true,
        userCount,
      },
      environment: envInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Debug endpoint error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
