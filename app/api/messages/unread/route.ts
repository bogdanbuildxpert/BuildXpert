import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// GET /api/messages/unread - Get count of unread messages for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the current user from the cookie
    const cookieStore = cookies();
    const userCookie = cookieStore.get("user");

    if (!userCookie || !userCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const userId = user.id;

    // Count unread messages where the current user is the receiver
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error getting unread message count:", error);
    return NextResponse.json(
      { error: "Failed to get unread message count" },
      { status: 500 }
    );
  }
}
