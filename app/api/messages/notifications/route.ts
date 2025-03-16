import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// GET /api/messages/notifications - Get recent unread messages for the current user
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

    // Get recent unread messages where the current user is the receiver
    const notifications = await prisma.message.findMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 most recent notifications
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return NextResponse.json(
      { error: "Failed to get notifications" },
      { status: 500 }
    );
  }
}

// POST /api/messages/notifications/mark-read - Mark a specific notification as read
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get("user");

    if (!userCookie || !userCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const userId = user.id;

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Verify the message belongs to the current user
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message || message.receiverId !== userId) {
      return NextResponse.json(
        { error: "Message not found or not authorized" },
        { status: 404 }
      );
    }

    // Mark the message as read
    await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
