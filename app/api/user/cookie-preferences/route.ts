import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const COOKIE_CONSENT_KEY = "cookie-consent";

export async function PUT(req: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to update cookie preferences" },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { cookiePreferences } = body;

    if (!cookiePreferences) {
      return NextResponse.json(
        { error: "Cookie preferences are required" },
        { status: 400 }
      );
    }

    // Ensure essential cookies are always true
    cookiePreferences.essential = true;

    // Update the user's cookie preferences in the database
    await prisma.user.update({
      where: { email: session.user.email },
      data: { cookiePreferences },
    });

    // Set the cookie
    cookies().set(COOKIE_CONSENT_KEY, JSON.stringify(cookiePreferences), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return NextResponse.json(
      { message: "Cookie preferences updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating cookie preferences:", error);
    return NextResponse.json(
      { error: "Failed to update cookie preferences" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to get cookie preferences" },
        { status: 401 }
      );
    }

    // Get the user's cookie preferences from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { cookiePreferences: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { cookiePreferences: user.cookiePreferences },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting cookie preferences:", error);
    return NextResponse.json(
      { error: "Failed to get cookie preferences" },
      { status: 500 }
    );
  }
}
