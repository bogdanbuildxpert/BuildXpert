import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    console.log("[DEBUG REGISTER] Registration request received");

    // Parse the request body
    let body;
    try {
      body = await request.json();
      console.log("[DEBUG REGISTER] Request body parsed", {
        email: body.email,
      });
    } catch (parseError) {
      console.error(
        "[DEBUG REGISTER] Failed to parse request body:",
        parseError
      );
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      console.error("[DEBUG REGISTER] Missing required fields");
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    console.log("[DEBUG REGISTER] Checking if user exists");

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.log("[DEBUG REGISTER] User already exists:", { email });
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    console.log("[DEBUG REGISTER] Hashing password");
    const hashedPassword = await hash(password, 10);

    // Create the user
    console.log("[DEBUG REGISTER] Creating new user");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT",
        // Set emailVerified to now to bypass verification
        emailVerified: new Date(),
      },
    });
    console.log("[DEBUG REGISTER] User created successfully:", {
      userId: user.id,
    });

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    // Return successful registration response
    return NextResponse.json(
      {
        ...userWithoutPassword,
        message: "Debug registration successful. Your account is ready to use.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Log detailed error for server-side debugging
    console.error("[DEBUG REGISTER] Registration error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    return NextResponse.json(
      {
        error: "Failed to register user",
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
