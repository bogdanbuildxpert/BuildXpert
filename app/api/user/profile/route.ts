import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    // Get user from cookie
    const userCookie = cookies().get("user")?.value;

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userData;
    try {
      userData = JSON.parse(userCookie);
    } catch (error) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 401 });
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userData.id },
      data: { name },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

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

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
