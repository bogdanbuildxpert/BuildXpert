import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/email";
import { sendPasswordResetEmailWithSesApi } from "@/lib/ses-email";
import { sendPasswordResetEmailWithSesApiV2 } from "@/lib/ses-email-v2";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Even if user doesn't exist, don't tell the client
    // This is a security measure to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Generate password reset token using JWT
    const token = generatePasswordResetToken(email);

    // Send password reset email with error handling for DigitalOcean
    try {
      console.log(
        "Attempting to send password reset email via primary method (SMTP)..."
      );
      await sendPasswordResetEmail(email, token);
      console.log("Password reset email sent successfully via SMTP");
    } catch (emailError: any) {
      console.error(
        "SMTP password reset email sending failed:",
        emailError.message
      );

      // If we're on DigitalOcean and hit a timeout, try the SES API
      if (
        emailError.code === "ETIMEDOUT" ||
        emailError.code === "ESOCKET" ||
        emailError.code === "ECONNECTION"
      ) {
        console.log(
          "Attempting fallback password reset email delivery via SES API..."
        );

        try {
          // Try using the SES API v2 as a fallback for network issues
          await sendPasswordResetEmailWithSesApiV2(email, token);
          console.log("Password reset email sent successfully via SES API v2");
        } catch (sesError) {
          console.error(
            "Both SMTP and SES API delivery methods failed:",
            sesError
          );
          // We'll continue the flow but log the error
        }
      } else {
        // For other errors, just log them
        console.error("Email sending failed (non-timeout error):", emailError);
      }
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
