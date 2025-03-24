import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import { generateVerificationToken } from "@/lib/token";
import { prisma } from "@/lib/prisma";
import { getJwtStatus } from "@/lib/token";

export async function GET(req: NextRequest) {
  try {
    console.log("Resend verification requested");

    // Get email from query params
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    // Handle missing email
    if (!email) {
      console.log("Email missing in resend request");
      return NextResponse.redirect(new URL("/resend-verification", url.origin));
    }

    // Check if user exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return NextResponse.redirect(
        new URL(`/resend-verification?error=user-not-found`, url.origin)
      );
    }

    if (user.emailVerified) {
      console.log(`Email already verified for: ${email}`);
      return NextResponse.redirect(
        new URL(`/login?info=already-verified`, url.origin)
      );
    }

    // Generate a new verification token
    const token = generateVerificationToken(email);

    // Send the verification email
    await sendVerificationEmail(email, token);

    console.log(`Verification email resent to: ${email}`);

    // Redirect to a confirmation page
    return NextResponse.redirect(
      new URL(`/resend-verification?success=true`, url.origin)
    );
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    const jwtStatus = getJwtStatus();

    return NextResponse.redirect(
      new URL(
        `/resend-verification?error=server-error&details=${encodeURIComponent(
          JSON.stringify({
            message: error instanceof Error ? error.message : "Unknown error",
            jwtStatus,
          })
        )}`,
        new URL(req.url).origin
      )
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Resend verification POST requested");

    // Get email from request body
    const { email } = await req.json();

    if (!email) {
      console.log("Email missing in resend POST request");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      console.log(`Email already verified for: ${email}`);
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // Generate a new verification token
    const token = generateVerificationToken(email);

    // Send the verification email
    await sendVerificationEmail(email, token);

    console.log(`Verification email resent to: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    const jwtStatus = getJwtStatus();

    return NextResponse.json(
      {
        error: "Failed to send verification email",
        details: {
          message: error instanceof Error ? error.message : "Unknown error",
          jwtStatus,
        },
      },
      { status: 500 }
    );
  }
}
