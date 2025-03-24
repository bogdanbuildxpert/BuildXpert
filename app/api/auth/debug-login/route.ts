import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { compare } from "bcrypt";

export const dynamic = "force-dynamic"; // Skip middleware authentication checks

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("Debug login attempt for:", email);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      console.log("Debug: User not found");
      return NextResponse.json(
        { error: "User not found", debug: true },
        { status: 401 }
      );
    }

    console.log("Debug: User found", {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      hasPassword: !!user.password,
    });

    // For users created with Google, they might not have a password
    if (!user.password) {
      console.log("Debug: Google account detected (no password)");
      return NextResponse.json(
        {
          error:
            "This appears to be a Google account. Please login with Google.",
          isGoogleAccount: true,
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    console.log("Debug: Password validation result:", isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials", debug: true },
        { status: 401 }
      );
    }

    // Check if email is verified - temporarily disable this check for debugging
    /* if (!user.emailVerified) {
      console.log("Debug: Email not verified");
      return NextResponse.json(
        {
          error: "Please verify your email before logging in",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    } */

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    console.log("Debug: Login successful");

    return NextResponse.json({
      user: userWithoutPassword,
      success: true,
    });
  } catch (error) {
    console.error("Debug login error:", error);
    return NextResponse.json(
      {
        error: "Failed to log in",
        debug: true,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
