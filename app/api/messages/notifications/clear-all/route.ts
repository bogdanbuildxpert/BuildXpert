import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

// Mark this route as dynamic since it uses cookies
export const dynamic = "force-dynamic";

// POST /api/messages/notifications/clear-all - Mark all notifications as read for the current user
export async function POST(request: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      console.log("No valid token found for clearing notifications");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.id as string;

    // Mark all unread messages for the user as read
    await prisma.message.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
