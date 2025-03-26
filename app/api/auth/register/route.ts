import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";
import { hash } from "bcrypt";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    console.log("[api/auth/register] Registration request received");

    // Parse the request body
    let body;
    try {
      body = await request.json();
      console.log("[api/auth/register] Request body parsed", {
        email: body.email,
      });
    } catch (parseError) {
      console.error(
        "[api/auth/register] Failed to parse request body:",
        parseError
      );
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password) {
      console.error("[api/auth/register] Missing required fields");
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    console.log("[api/auth/register] Checking if user exists");

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.log("[api/auth/register] User already exists:", { email });
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    console.log("[api/auth/register] Hashing password");
    const hashedPassword = await hash(password, 10);

    // Create the user
    console.log("[api/auth/register] Creating new user");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "CLIENT",
      },
    });
    console.log("[api/auth/register] User created successfully:", {
      userId: user.id,
    });

    // Generate email verification token
    const token = generateVerificationToken(email);
    console.log(
      `[api/auth/register] Generated verification token for: ${email} (length: ${token.length})`
    );

    // Variable to track if email was sent successfully
    let emailSent = false;
    let emailErrorDetails = null;

    // Send verification email
    try {
      console.log("[api/auth/register] Sending verification email...");

      // Use the CommonJS email module in production Node.js environments
      let emailResult;
      let emailSendingMethod = "";

      // Try both methods of sending email with detailed error capture
      try {
        // Method 1: Try CommonJS module first for production Node.js
        console.log(
          "[api/auth/register] Attempting to use CommonJS email module"
        );
        const emailModule = require("../../../../lib/email.js");

        // First try standard email sending
        emailResult = await emailModule.sendVerificationEmail(email, token);
        emailSendingMethod = "CommonJS module";
        console.log(
          "[api/auth/register] Used CommonJS email module successfully"
        );
        emailSent = true;
      } catch (error1) {
        // Log the first error but don't throw yet
        const moduleError = error1 as Error;
        console.error("[api/auth/register] CommonJS email module failed:", {
          message: moduleError.message,
          stack: moduleError.stack,
          code: (moduleError as any).code,
        });

        try {
          // Method 2: Fall back to TypeScript module if CommonJS fails
          console.log(
            "[api/auth/register] Falling back to TypeScript email module"
          );
          const { sendVerificationEmail } = await import("@/lib/email");
          emailResult = await sendVerificationEmail(email, token);
          emailSendingMethod = "TypeScript module";
          console.log(
            "[api/auth/register] Used TypeScript email module successfully"
          );
          emailSent = true;
        } catch (error2) {
          // Log the second error and try emergency email
          const moduleError2 = error2 as Error;
          console.error("[api/auth/register] TypeScript email module failed:", {
            message: moduleError2.message,
            stack: moduleError2.stack,
            code: (moduleError2 as any).code,
          });

          try {
            // Method 3: Last resort - try emergency simple email
            console.log(
              "[api/auth/register] Attempting emergency email method"
            );
            const emailModule = require("../../../../lib/email.js");
            const verificationLink = `${
              process.env.NEXT_PUBLIC_APP_URL || "https://buildxpert.ie"
            }/verify-email?token=${token}`;
            const emergencyResult = await emailModule.sendEmergencyEmail(
              email,
              "Verify your BuildXpert account",
              `Please verify your account by clicking this link: ${verificationLink}`
            );
            emailSendingMethod = "Emergency email";
            console.log(
              "[api/auth/register] Used emergency email successfully:",
              emergencyResult
            );
            emailSent = emergencyResult.success;
          } catch (error3) {
            // All email methods failed
            const finalError = error3 as Error;
            console.error("[api/auth/register] All email methods failed:", {
              message: finalError.message,
              stack: finalError.stack,
              code: (finalError as any).code,
            });
            throw finalError; // Will be caught by outer catch block
          }
        }
      }

      if (emailSent) {
        console.log(
          "[api/auth/register] Email sent successfully using " +
            emailSendingMethod,
          {
            result: emailResult,
            email,
          }
        );
      }
    } catch (emailError: any) {
      // Store error details for logging but don't fail registration
      emailErrorDetails = {
        message: emailError.message,
        stack: emailError.stack,
        code: emailError.code,
        command: emailError.command,
        responseCode: emailError.responseCode,
      };

      console.error(
        "[api/auth/register] All email sending methods failed:",
        emailErrorDetails
      );

      // We don't return error - continue with registration even if email fails
    }

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    // Store detailed registration success/failure info in logs
    console.log("[api/auth/register] Registration completed", {
      userId: user.id,
      email: user.email,
      emailSent,
      emailError: emailErrorDetails ? "Email delivery failed" : null,
    });

    // Return successful registration response
    return NextResponse.json(
      {
        ...userWithoutPassword,
        message: emailSent
          ? "Registration successful. Please check your email to verify your account."
          : "Registration successful. Please contact support if you don't receive a verification email.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Log detailed error for server-side debugging
    console.error("[api/auth/register] Registration error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
