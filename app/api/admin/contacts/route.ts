import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transporter } from "@/lib/email";

export async function GET(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = status ? { status: status as any } : {};

    // Get contacts with pagination
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.contact.count({ where });

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// Update contact status
export async function PATCH(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Contact ID and status are required" },
        { status: 400 }
      );
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: { status: status as any },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// Send response email to contact
export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { contactId, responseMessage, responseSubject } = await req.json();

    if (!contactId || !responseMessage) {
      return NextResponse.json(
        { error: "Contact ID and response message are required" },
        { status: 400 }
      );
    }

    // Get contact details
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Send response email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: contact.email,
      subject: responseSubject || "Response to your inquiry - BuildXpert",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Response to Your Inquiry</h2>
          <p>Hello ${contact.name},</p>
          <p>Thank you for contacting BuildXpert. Here is our response to your inquiry:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${responseMessage.replace(/\n/g, "<br>")}
          </div>
          <p>If you have any further questions, please don't hesitate to contact us.</p>
          <p>Best regards,</p>
          <p><strong>The BuildXpert Team</strong></p>
        </div>
      `,
    });

    // Update contact status to RESPONDED
    await prisma.contact.update({
      where: { id: contactId },
      data: { status: "RESPONDED" },
    });

    return NextResponse.json({
      success: true,
      message: "Response email sent successfully",
    });
  } catch (error) {
    console.error("Error sending response email:", error);
    return NextResponse.json(
      { error: "Failed to send response email" },
      { status: 500 }
    );
  }
}
