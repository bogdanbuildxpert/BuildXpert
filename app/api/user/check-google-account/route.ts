import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Try to get user from NextAuth token first
    let userEmail = email;

    if (!userEmail) {
      // Try to get token from NextAuth
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token && token.email) {
        // If we have a NextAuth token with email, use that
        userEmail = token.email as string;
      } else {
        // Fall back to user cookie
        const userCookie = cookies().get("user")?.value;

        if (!userCookie) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const userData = JSON.parse(userCookie);
          userEmail = userData.email;
        } catch (error) {
          return NextResponse.json(
            { error: "Invalid user data" },
            { status: 401 }
          );
        }
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is a Google account (empty or null password)
    const isGoogleAccount = !user.password || user.password === "";

    return NextResponse.json({ isGoogleAccount }, { status: 200 });
  } catch (error) {
    console.error("Error checking Google account:", error);
    return NextResponse.json(
      { error: "Failed to check account type" },
      { status: 500 }
    );
  }
}
