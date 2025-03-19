import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  sendContactConfirmationEmail,
  sendContactNotificationEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      preferredContact,
    } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate preferred contact method
    if (preferredContact === "PHONE" && !phone) {
      return NextResponse.json(
        {
          error:
            "Phone number is required when phone is the preferred contact method",
        },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`;

    // Create contact entry in database
    await prisma.contact.create({
      data: {
        name: fullName,
        email,
        phone: phone || null,
        message: `Subject: ${subject}\n\n${message}`,
        preferredContact: preferredContact || "EMAIL",
        status: "NEW",
      },
    });

    // Send confirmation email to the user
    try {
      await sendContactConfirmationEmail(email, firstName, subject);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue with the process even if email fails
    }

    // Send notification email to admin
    try {
      await sendContactNotificationEmail({
        name: fullName,
        email,
        phone,
        subject,
        message,
        preferredContact,
      });
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
      // Continue with the process even if email fails
    }

    return NextResponse.json(
      { success: true, message: "Contact form submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
