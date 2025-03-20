import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/token";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Log that we're processing a verification request
    console.log("Processing email verification request");

    const { token } = await req.json();

    if (!token) {
      console.log("Verification failed: Token missing");
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    console.log("Verifying token...");

    // Verify the token
    try {
      const decoded = verifyToken(token);

      if (decoded.purpose !== "email-verification") {
        console.log(
          "Verification failed: Wrong token purpose",
          decoded.purpose
        );
        return NextResponse.json(
          { error: "Invalid verification token purpose" },
          { status: 400 }
        );
      }

      console.log("Token verified successfully for email:", decoded.email);

      // Update user's email verification status
      try {
        const user = await prisma.user.update({
          where: { email: decoded.email },
          data: { emailVerified: new Date() },
        });

        if (!user) {
          console.log(
            "Verification failed: User not found for email",
            decoded.email
          );
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        console.log("Email verified successfully for user:", user.id);
        return NextResponse.json(
          { message: "Email verified successfully" },
          { status: 200 }
        );
      } catch (dbError) {
        console.error("Database error during verification:", dbError);
        return NextResponse.json(
          { error: "Failed to update user verification status" },
          { status: 500 }
        );
      }
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Email verification error:", error);
    // Detailed error response for troubleshooting
    return NextResponse.json(
      {
        error: "Failed to verify email",
        details: error instanceof Error ? error.message : "Unknown error",
        jwt_secret_set: !!process.env.JWT_SECRET,
      },
      { status: 500 }
    );
  }
}
