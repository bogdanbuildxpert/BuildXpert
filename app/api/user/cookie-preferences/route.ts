import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";

const COOKIE_CONSENT_KEY = "cookie-consent";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: true,
  preferences: true,
};

export async function PUT(req: Request) {
  try {
    // Get the request body
    const body = await req.json();
    const { cookiePreferences } = body as {
      cookiePreferences: CookiePreferences;
    };

    if (!cookiePreferences) {
      return NextResponse.json(
        { error: "Cookie preferences are required" },
        { status: 400 }
      );
    }

    // Ensure essential cookies are always true
    cookiePreferences.essential = true;

    // Get the current session
    const session = await getServerSession(authOptions);

    // If user is logged in, update their preferences in the database
    if (session?.user?.email) {
      const updateData: Prisma.UserUpdateInput = {
        cookiePreferences: cookiePreferences as unknown as Prisma.JsonValue,
      };

      await prisma.user.update({
        where: { email: session.user.email },
        data: updateData,
      });
    }

    // Set the cookie for all users
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

    // If user is not logged in, get preferences from cookies
    if (!session?.user?.email) {
      const cookieStore = cookies();
      const storedPreferences = cookieStore.get(COOKIE_CONSENT_KEY);

      if (storedPreferences) {
        try {
          const preferences = JSON.parse(
            storedPreferences.value
          ) as CookiePreferences;
          return NextResponse.json(
            { cookiePreferences: preferences },
            { status: 200 }
          );
        } catch (error) {
          console.error("Error parsing cookie preferences:", error);
        }
      }

      // Return default preferences if no cookie found
      return NextResponse.json(
        { cookiePreferences: defaultPreferences },
        { status: 200 }
      );
    }

    // For logged-in users, get preferences from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        cookiePreferences: true,
      } as const,
    });

    if (!user?.cookiePreferences) {
      return NextResponse.json(
        { cookiePreferences: defaultPreferences },
        { status: 200 }
      );
    }

    const preferences = user.cookiePreferences as unknown as CookiePreferences;
    return NextResponse.json(
      { cookiePreferences: preferences },
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
