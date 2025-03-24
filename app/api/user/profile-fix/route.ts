import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

// Mark this route as dynamic since it uses cookies
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    console.log("Profile update request for:", email, "New name:", name);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("User not found:", email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found, ID:", user.id, "Updating with name:", name);

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = updatedUser;

    // Get user from cookie
    const userCookie = cookies().get("user")?.value;

    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);

        // Update cookie with new user data
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

        console.log("Updated user cookie with new name");
      } catch (cookieError) {
        console.error("Error updating user cookie:", cookieError);
        // Continue anyway, we can still update the database
      }
    }

    console.log("Profile updated successfully for:", email);
    return NextResponse.json({
      ...userWithoutPassword,
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
