import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";

// Add this export to make the route dynamically rendered
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    console.log("[verify-email] Processing email verification request");
    console.log(`[verify-email] Environment: ${process.env.NODE_ENV}`);
    console.log(`[verify-email] Request URL: ${request.url}`);

    // Get the token from the URL parameter
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    console.log(`[verify-email] Token present: ${!!token}`);

    if (!token) {
      console.log("[verify-email] No token provided");
      return NextResponse.redirect(new URL("/verify-email", url.origin));
    }

    // Always redirect API calls to client route for consistent behavior
    console.log("[verify-email] Redirecting to client-side verification route");
    return NextResponse.redirect(
      new URL(`/verify-email?token=${token}`, url.origin)
    );

    // The rest of the function is now unreachable because we always redirect
    // This is intentional - we want verification to happen client-side
  } catch (error) {
    console.error("[verify-email] Verification error:", error);
    const errorUrl = new URL(request.url);
    return NextResponse.redirect(
      new URL("/verify-email?error=verification_failed", errorUrl.origin)
    );
  }
}

// Add support for POST requests from the client-side verification page
export async function POST(request: NextRequest) {
  try {
    console.log("[verify-email] Processing email verification POST request");

    // Parse the request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      console.log("[verify-email] No token provided in POST request");
      return NextResponse.json(
        { error: "Verification token is missing" },
        { status: 400 }
      );
    }

    console.log("[verify-email] Verifying token from POST request");

    // Verify the token
    let decodedToken;
    try {
      decodedToken = verifyToken(token);
      console.log(
        `[verify-email] Token verified successfully for email: ${decodedToken.email}`
      );
    } catch (error) {
      console.error("[verify-email] Token verification failed:", error);
      return NextResponse.json(
        {
          error: "Invalid or expired token",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    if (!decodedToken?.email) {
      console.log("[verify-email] Token did not contain an email");
      return NextResponse.json(
        {
          error: "Invalid token format",
          details: "Token does not contain email information",
        },
        { status: 400 }
      );
    }

    const email = decodedToken.email;

    // Find the user by email
    console.log(`[verify-email] Looking up user with email: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user not found, return error
    if (!user) {
      console.log(`[verify-email] No user found with email: ${email}`);
      return NextResponse.json(
        {
          error: "User not found",
          details: `No user found with email: ${email}`,
        },
        { status: 404 }
      );
    }

    // If user's email is already verified, return success with a message
    if (user.emailVerified) {
      console.log(`[verify-email] Email already verified for: ${email}`);
      return NextResponse.json({
        message: "Email already verified",
        verified: true,
      });
    }

    // Update the user's emailVerified field
    console.log(`[verify-email] Updating emailVerified for user: ${email}`);
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    console.log(`[verify-email] Email verification successful for: ${email}`);

    // Return success response
    return NextResponse.json({
      message: "Email verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("[verify-email] Verification error:", error);
    return NextResponse.json(
      {
        error: "Verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
