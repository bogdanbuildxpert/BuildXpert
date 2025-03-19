import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// Mark this route as dynamic since it uses cookies
export const dynamic = "force-dynamic";

// DELETE /api/messages/[id]/delete - Delete a message
export async function DELETE(
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

    // Check if message exists
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if the current user is the sender of the message
    if (message.senderId !== userId) {
      return NextResponse.json(
        { error: "You can only delete messages you sent" },
        { status: 403 }
      );
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
