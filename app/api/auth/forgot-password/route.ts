import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/email";
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

    // Send password reset email
    try {
      console.log("Sending password reset email...");
      await sendPasswordResetEmail(email, token);
      console.log("Password reset email sent successfully");
    } catch (emailError: any) {
      console.error("Password reset email sending failed:", emailError.message);
      // Log the error but continue the flow
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
