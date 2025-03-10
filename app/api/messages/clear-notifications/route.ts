import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// POST /api/messages/clear-notifications - Clear all unread notifications for a user
export async function POST(request: NextRequest) {
  try {
    // Get the current user from the cookie
    const cookieStore = cookies();
    const userCookie = cookieStore.get("user");

    if (!userCookie || !userCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const userId = user.id;

    // Mark all unread messages as read (only for messages where the user is the receiver)
    const markAsReadResult = await prisma.message.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      messagesUpdated: markAsReadResult.count,
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
