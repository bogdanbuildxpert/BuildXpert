import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// Mark this route as dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get the email and name from query params
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    console.log(`Setting display name for ${email} to "${name}"`);

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("User not found:", email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the user's name
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    // Update the user cookie if it exists
    const userCookie = cookies().get("user")?.value;
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        const newUserData = {
          ...userData,
          name: updatedUser.name,
        };

        cookies().set({
          name: "user",
          value: JSON.stringify(newUserData),
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      } catch (error) {
        console.error("Error updating user cookie:", error);
        // Continue anyway
      }
    }

    console.log("Name updated successfully");

    // Redirect to the profile page
    return NextResponse.redirect(new URL("/profile", request.url));
  } catch (error) {
    console.error("Error setting display name:", error);
    return NextResponse.json(
      { error: "Failed to set display name" },
      { status: 500 }
    );
  }
}
