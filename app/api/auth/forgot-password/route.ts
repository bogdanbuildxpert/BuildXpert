import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/token";
// Use direct path to JavaScript file
import * as crypto from "crypto";

// Direct inline implementation of sendPasswordResetEmail function
// to avoid module loading issues
export async function sendPasswordResetEmail(to: string, token: string) {
  console.log("INLINE PASSWORD RESET: Starting email send process for", to);
  try {
    // Create a direct import of the nodemailer module
    const nodemailer = require("nodemailer");
    console.log("INLINE PASSWORD RESET: Required nodemailer module");

    // Define the function directly to avoid imports
    const getAppUrl = () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
      console.log("INLINE PASSWORD RESET: App URL from env:", appUrl);
      return (
        appUrl ||
        (process.env.NODE_ENV === "production"
          ? "https://buildxpert.ie"
          : "http://localhost:3000")
      );
    };

    const appUrl = getAppUrl();
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // Simple debug logging
    console.log(`INLINE PASSWORD RESET: Sending to ${to}`);
    console.log(`INLINE PASSWORD RESET: Reset link: ${resetLink}`);

    // Create transporter
    console.log("INLINE PASSWORD RESET: Creating transporter with settings:", {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: process.env.EMAIL_SERVER_SECURE,
      auth: {
        user: process.env.EMAIL_SERVER_USER ? "CONFIGURED" : "MISSING",
        pass: process.env.EMAIL_SERVER_PASSWORD ? "CONFIGURED" : "MISSING",
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      secure: process.env.EMAIL_SERVER_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    console.log("INLINE PASSWORD RESET: Transporter created");

    // Create email layout
    const createEmailLayout = (content: string) => {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BuildXpert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center; border-bottom: 1px solid #eee;">
                <h1 style="margin: 0; color: #333; font-size: 24px;">BuildXpert</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 0;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 0; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>&copy; ${new Date().getFullYear()} BuildXpert. All rights reserved.</p>
                <p>123 Construction Ave, Dublin, Ireland</p>
                <p>This is a transactional email related to your interaction with BuildXpert.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    };

    // Simplified template
    const subject = "Reset Your BuildXpert Password";
    const content = `
      <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
      <p>We received a request to reset your password for your BuildXpert account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #0070f3; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour for security reasons.
      </p>
      <p style="color: #666; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, you can also copy and paste this link into your browser:
        <br>
        <a href="${resetLink}" style="color: #0070f3; word-break: break-all;">${resetLink}</a>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM_NAME
        ? `"${process.env.EMAIL_FROM_NAME}" <${
            process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || ""
          }>`
        : process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "",
      to,
      subject,
      text: `Reset your BuildXpert password by clicking this link: ${resetLink}. This link will expire in 1 hour.`,
      html: createEmailLayout(content),
    };

    console.log("INLINE PASSWORD RESET: Mail options ready, now sending:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log(`INLINE PASSWORD RESET: Email sent successfully to ${to}`, {
      messageId: result.messageId,
    });

    return {
      success: true,
      messageId: result.messageId || null,
    };
  } catch (error: any) {
    console.error(`INLINE PASSWORD RESET: Error sending email:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

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
      console.log(
        `No user found with email: ${email}, returning generic success message`
      );
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
    console.log(`ROUTE_TS: About to send password reset email to ${email}`);
    try {
      console.log("Sending password reset email...");
      // Use our direct function implementation
      console.log(`ROUTE_TS: Calling inline sendPasswordResetEmail function`);

      // Direct function call to the inline implementation with fixed email
      const emailResult = await sendPasswordResetEmail(email, token);
      console.log(`ROUTE_TS: Email function returned result:`, emailResult);

      if (!emailResult.success) {
        console.error(
          "Password reset email sending failed:",
          emailResult.error
        );
        // Log the error but continue the flow without alerting the user
      } else {
        console.log("Password reset email sent successfully");
      }
    } catch (emailError: any) {
      console.error("Password reset email sending failed:", emailError.message);
      // Log the error but continue the flow
    }
    console.log(`ROUTE_TS: Completed email sending attempt`);

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
