import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/email";
import { sendPasswordResetEmailWithSesApi } from "@/lib/ses-email";
import { sendPasswordResetEmailWithSesApiV2 } from "@/lib/ses-email-v2";

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

    // Try in sequence: SES API v2 -> SES API v3 -> SMTP
    try {
      // First try: AWS SDK v2 implementation (often more reliable with credentials)
      console.log("Attempting to send email using SES API v2");
      await sendPasswordResetEmailWithSesApiV2(email, resetToken);
      console.log("Password reset email sent successfully using SES API v2");

      return NextResponse.json(
        { message: "Password reset instructions sent to your email" },
        { status: 200 }
      );
    } catch (sesV2Error) {
      console.error("Failed to send email with SES API v2:", sesV2Error);

      // Second try: AWS SDK v3 implementation
      try {
        console.log("Falling back to SES API v3...");
        await sendPasswordResetEmailWithSesApi(email, resetToken);
        console.log("Password reset email sent successfully using SES API v3");

        return NextResponse.json(
          { message: "Password reset instructions sent to your email" },
          { status: 200 }
        );
      } catch (sesV3Error) {
        console.error("Failed to send email with SES API v3:", sesV3Error);

        // Last resort: Try SMTP method
        try {
          console.log("Falling back to SMTP method...");
          await sendPasswordResetEmail(email, resetToken);
          console.log(
            "Password reset email sent successfully using SMTP fallback"
          );

          return NextResponse.json(
            { message: "Password reset instructions sent to your email" },
            { status: 200 }
          );
        } catch (smtpError) {
          console.error("Failed to send email with all methods:", smtpError);

          return NextResponse.json(
            {
              error:
                "We're experiencing issues with our email service. Please try again later or contact support if the problem persists.",
            },
            { status: 500 }
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
