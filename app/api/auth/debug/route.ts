import { NextResponse } from "next/server";
import { getJwtStatus } from "@/lib/token";
import { transporter } from "@/lib/email";

export async function GET() {
  try {
    // Check JWT configuration
    const jwtStatus = getJwtStatus();

    // Test email configuration
    let emailStatus = "Unchecked";
    let emailError = null;

    try {
      // Verify SMTP connection
      const verifyResult = await transporter.verify();
      emailStatus = verifyResult ? "Connected" : "Failed";
    } catch (error) {
      emailStatus = "Error";
      emailError = error instanceof Error ? error.message : String(error);
    }

    // Collect environment variables (excluding sensitive values)
    const safeEnvVars = {
      APP_URL: process.env.APP_URL || "Not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || "Not set",
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || "Not set",
      EMAIL_SERVER_SECURE: process.env.EMAIL_SERVER_SECURE || "Not set",
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "Not set",
      NODE_ENV: process.env.NODE_ENV || "Not set",
      VERCEL_ENV: process.env.VERCEL_ENV || "Not set",
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER
        ? "Set (value hidden)"
        : "Not set",
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD
        ? "Set (value hidden)"
        : "Not set",
      JWT_SECRET: process.env.JWT_SECRET
        ? `Set (${process.env.JWT_SECRET.length} chars)`
        : "Not set",
    };

    // Return diagnostic information
    return NextResponse.json({
      status: "ok",
      jwt: jwtStatus,
      email: {
        status: emailStatus,
        error: emailError,
        config: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          secure: process.env.EMAIL_SERVER_SECURE === "true",
          auth: {
            user: process.env.EMAIL_SERVER_USER ? "Set (hidden)" : "Not set",
            pass: process.env.EMAIL_SERVER_PASSWORD
              ? "Set (hidden)"
              : "Not set",
          },
        },
      },
      environment: safeEnvVars,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to generate debug info",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
