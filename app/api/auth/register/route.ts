import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";
import { sendVerificationEmailWithSesApi } from "@/lib/ses-email";
import { sendVerificationEmailWithSesApiV2 } from "@/lib/ses-email-v2";
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
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email with error handling for DigitalOcean environments
    try {
      console.log(
        "Attempting to send verification email via primary method (SMTP)..."
      );
      await sendVerificationEmail(email, token);
      console.log("Verification email sent successfully via SMTP");
    } catch (emailError: any) {
      console.error("SMTP email sending failed:", emailError.message);

      // If we're on DigitalOcean and hit a timeout, try the SES API
      if (
        emailError.code === "ETIMEDOUT" ||
        emailError.code === "ESOCKET" ||
        emailError.code === "ECONNECTION"
      ) {
        console.log("Attempting fallback email delivery via SES API...");

        try {
          // Try using the SES API v2 as a fallback for network issues
          await sendVerificationEmailWithSesApiV2(email, token);
          console.log("Verification email sent successfully via SES API v2");
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

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    console.log("[api/auth/register] Registration completed successfully");
    return NextResponse.json(
      {
        ...userWithoutPassword,
        message:
          "Registration successful. Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/auth/register] Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
