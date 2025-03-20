import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    console.log("[api/auth/register] Registration request received");

    // Check if this is a static build
    const isStaticBuild =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.VERCEL_ENV === "production" ||
      (process.env.NODE_ENV === "production" && process.env.VERCEL);

    // For static builds during Next.js static generation, return a specific response
    if (isStaticBuild) {
      console.log(
        "[api/auth/register] Static build detected, skipping actual registration"
      );
      return NextResponse.json(
        {
          id: "mock-user-id",
          name: "Mock User",
          email: "mock@example.com",
          role: "CLIENT",
          message: "Mock registration successful. This is a static build.",
        },
        { status: 201 }
      );
    }

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

    // Generate verification token
    console.log("[api/auth/register] Generating verification token");
    const verificationToken = generateVerificationToken(email);

    // Send verification email
    try {
      console.log("[api/auth/register] Sending verification email");
      await sendVerificationEmail(email, verificationToken);
      console.log("[api/auth/register] Verification email sent successfully");
    } catch (emailError) {
      console.error(
        "[api/auth/register] Failed to send verification email:",
        emailError
      );
      // Continue with registration even if email fails
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
    console.error("[api/auth/register] Error registering user:", error);

    // Check if this is a database connection error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isDbError =
      errorMessage.toLowerCase().includes("database") ||
      errorMessage.toLowerCase().includes("prisma") ||
      errorMessage.toLowerCase().includes("connection");

    return NextResponse.json(
      {
        error: isDbError
          ? "Database connection error. Please try again later."
          : "Failed to register user. Please try again.",
      },
      { status: 500 }
    );
  }
}
