import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, email, password, role } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "CLIENT",
      },
    });

    // Generate verification token
    const verificationToken = generateVerificationToken(email);

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with registration even if email fails
    }

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        ...userWithoutPassword,
        message:
          "Registration successful. Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
