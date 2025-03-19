import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/token";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    try {
      // Verify the token
      const decoded = verifyToken(token);

      // Check if it's a password reset token
      if (decoded.purpose !== "password-reset") {
        return NextResponse.json(
          { error: "Invalid token type" },
          { status: 400 }
        );
      }

      const email = decoded.email;

      // Find the user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Skip password reset for Google accounts (empty password)
      const isGoogleAccount = !user.password || user.password === "";
      if (isGoogleAccount) {
        return NextResponse.json(
          {
            error:
              "This account uses Google authentication. Please sign in with Google.",
          },
          { status: 400 }
        );
      }

      // Hash the new password
      const hashedPassword = await hash(password, 10);

      // Update the user's password
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });

      return NextResponse.json(
        { message: "Password reset successfully" },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
