import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/token";

// Add this export to make the route dynamically rendered
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    console.log("[verify-email] Processing email verification request");

    // Get the token from the URL parameter
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      console.log("[verify-email] No token provided");
      return NextResponse.redirect(
        new URL("/login?error=missing_token", request.url)
      );
    }

    console.log("[verify-email] Verifying token");

    // Verify the token
    let decodedToken;
    try {
      decodedToken = verifyToken(token);
      console.log(
        `[verify-email] Token verified successfully for email: ${decodedToken.email}`
      );
    } catch (error) {
      console.error("[verify-email] Token verification failed:", error);
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", request.url)
      );
    }

    if (!decodedToken?.email) {
      console.log("[verify-email] Token did not contain an email");
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", request.url)
      );
    }

    const email = decodedToken.email;

    // Find the user by email
    console.log(`[verify-email] Looking up user with email: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user not found, redirect to login with error
    if (!user) {
      console.log(`[verify-email] No user found with email: ${email}`);
      return NextResponse.redirect(
        new URL("/login?error=user_not_found", request.url)
      );
    }

    // If user's email is already verified, redirect to login with message
    if (user.emailVerified) {
      console.log(`[verify-email] Email already verified for: ${email}`);
      return NextResponse.redirect(
        new URL("/login?message=already_verified", request.url)
      );
    }

    // Update the user's emailVerified field
    console.log(`[verify-email] Updating emailVerified for user: ${email}`);
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    console.log(`[verify-email] Email verification successful for: ${email}`);

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/login?message=email_verified", request.url)
    );
  } catch (error) {
    console.error("[verify-email] Verification error:", error);
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", request.url)
    );
  }
}
