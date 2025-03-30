import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if the email exists in our email_preferences table
    const existingPreference = await prisma.emailPreference.findUnique({
      where: { email },
    });

    if (existingPreference) {
      // Update existing preference to opt out
      await prisma.emailPreference.update({
        where: { email },
        data: {
          marketingEmails: false,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new preference record with opt-out
      await prisma.emailPreference.create({
        data: {
          email,
          marketingEmails: false,
        },
      });
    }

    // Log the unsubscribe request
    await prisma.emailLog.create({
      data: {
        email,
        action: "UNSUBSCRIBE",
        details: "User unsubscribed via unsubscribe page",
      },
    });

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed from marketing emails",
    });
  } catch (error) {
    console.error("Error processing unsubscribe request:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe request" },
      { status: 500 }
    );
  }
}
