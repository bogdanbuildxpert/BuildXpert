import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
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

      return NextResponse.json(
        {
          valid: true,
          email: decoded.email,
        },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
