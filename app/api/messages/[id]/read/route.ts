import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// PUT /api/messages/[id]/read - Mark a message as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user from the cookie
    const cookieStore = cookies();
    const userCookie = cookieStore.get("user");

    if (!userCookie || !userCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);
    const userId = user.id;
    const messageId = params.id;

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    // Check if message exists and the current user is the receiver
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.receiverId !== userId) {
      return NextResponse.json(
        { error: "You can only mark messages sent to you as read" },
        { status: 403 }
      );
    }

    // Update the message to mark it as read
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
