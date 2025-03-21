import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security reasons, don't reveal if the email exists or not
    // Always return success even if the email doesn't exist
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If your email exists in our system, you will receive password reset instructions.",
        },
        { status: 200 }
      );
    }

    // Skip password reset for Google accounts (empty password)
    const isGoogleAccount = !user.password || user.password === "";
    if (isGoogleAccount) {
      return NextResponse.json(
        {
          error:
            "This account uses Google authentication. Please sign in with Google.",
        },
        { status: 400 }
      );
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(email);

    // Send password reset email with better error handling
    try {
      await sendPasswordResetEmail(email, resetToken);

      return NextResponse.json(
        { message: "Password reset instructions sent to your email" },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);

      return NextResponse.json(
        {
          error:
            "We're experiencing issues with our email service. Please try again later or contact support if the problem persists.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
