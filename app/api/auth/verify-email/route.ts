import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/token";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Verify the token
    const decoded = verifyToken(token);

    if (decoded.purpose !== "email-verification") {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    const user = await prisma.user.update({
      where: { email: decoded.email },
      data: { emailVerified: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
