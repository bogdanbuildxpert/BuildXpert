import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateVerificationToken } from "@/lib/token";
import { hash } from "bcrypt";
import { transporter } from "@/lib/email";

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
    let token;
    try {
      token = generateVerificationToken(email);
      console.log(
        `[api/auth/register] Generated verification token for: ${email} (length: ${
          token?.length || 0
        })`
      );
    } catch (tokenError) {
      console.error(
        "[api/auth/register] Failed to generate token:",
        tokenError
      );
      // We'll continue even if token generation fails
    }

    // Variable to track if email was sent successfully
    let emailSent = false;

    // Send verification email using a simple approach
    if (token) {
      try {
        console.log("[api/auth/register] Sending verification email...");

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_URL ||
          "http://localhost:3000";
        const verificationLink = `${appUrl}/verify-email?token=${token}`;

        // Simple email template
        const content = `
          <h2>Welcome to BuildXpert!</h2>
          <p>Thank you for creating an account. Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationLink}">Verify Email Address</a></p>
          <p>If the link doesn't work, copy and paste this URL into your browser:</p>
          <p>${verificationLink}</p>
        `;

        // Send directly with nodemailer
        await transporter.sendMail({
          from:
            process.env.EMAIL_FROM ||
            process.env.EMAIL_SERVER_USER ||
            "noreply@buildxpert.com",
          to: email,
          subject: "Verify your BuildXpert account",
          html: content,
        });

        emailSent = true;
        console.log("[api/auth/register] Verification email sent successfully");
      } catch (emailError) {
        console.error("[api/auth/register] Email sending failed:", emailError);
        // Continue with registration even if email fails
      }
    }

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    // Store detailed registration success/failure info in logs
    console.log("[api/auth/register] Registration completed", {
      userId: user.id,
      email: user.email,
      emailSent,
    });

    // Return successful registration response
    return NextResponse.json(
      {
        ...userWithoutPassword,
        message: emailSent
          ? "Registration successful. Please check your email to verify your account."
          : "Registration successful. Email verification is currently unavailable.",
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
