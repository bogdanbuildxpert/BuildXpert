import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { transporter } from "@/lib/email";
import { getToken } from "next-auth/jwt";

// Create a dedicated Prisma client for this route
const prisma = new PrismaClient();

// Define the ContactStatus enum to match Prisma schema
type ContactStatus = "NEW" | "REVIEWED" | "RESPONDED" | "ARCHIVED";

// Mark this route as dynamic since it uses authentication
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get token from NextAuth JWT - log the headers for debugging
    console.log("Auth headers received:", {
      authHeader: req.headers.get("authorization"),
      cookieHeader: req.headers.get("cookie"),
    });

    // Try to get the token with explicit options
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: "next-auth.session-token",
    });

    // Debug log token presence
    console.log(
      "Token check result:",
      token ? "Token found" : "No token found"
    );

    // Check if user is authenticated and is an admin
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = token.role as string;
    if (userRole !== "ADMIN" && userRole !== "admin") {
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
    const where = status ? { status: status as ContactStatus } : {};

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
export async function PATCH(req: NextRequest) {
  try {
    // Use NextAuth token to check admin access with explicit options
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: "next-auth.session-token",
    });

    // Check if user is authenticated and is an admin
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = token.role as string;
    if (userRole !== "ADMIN" && userRole !== "admin") {
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
      data: { status: status as ContactStatus },
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
export async function POST(req: NextRequest) {
  try {
    // Use NextAuth token to check admin access
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
      cookieName: "next-auth.session-token",
    });

    // Check if user is authenticated and is an admin
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = token.role as string;
    if (userRole !== "ADMIN" && userRole !== "admin") {
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

    // Create email content
    const content = `
      <h2 style="color: #333; margin-bottom: 20px;">Response to Your Inquiry</h2>
      <p>Hello ${contact.name},</p>
      <p>Thank you for contacting BuildXpert. Here is our response to your inquiry:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        ${responseMessage.replace(/\n/g, "<br>")}
      </div>
      <p>If you have any further questions, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p><strong>The BuildXpert Team</strong></p>
    `;

    // Create email layout
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BuildXpert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0; text-align: center; border-bottom: 1px solid #eee;">
              <img src="${
                process.env.NEXT_PUBLIC_APP_URL
              }/favicon.svg" alt="BuildXpert Logo" width="40" style="display: inline-block;">
              <h1 style="margin: 10px 0 0; color: #333; font-size: 24px;">BuildXpert</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 0;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 0; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>&copy; ${new Date().getFullYear()} BuildXpert. All rights reserved.</p>
              <p>123 Construction Ave, Dublin, Ireland</p>
              <p>This is a response to your inquiry with BuildXpert.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send response email
    await transporter.sendMail({
      from: {
        name: "BuildXpert Support",
        address: process.env.EMAIL_SERVER_USER || "",
      },
      to: contact.email,
      subject: responseSubject || "Response to your inquiry - BuildXpert",
      text: `Hello ${contact.name}, Thank you for contacting BuildXpert. Here is our response to your inquiry: ${responseMessage}`,
      html: emailHtml,
      replyTo: process.env.EMAIL_SERVER_USER || "",
      headers: {
        "List-Unsubscribe": `<${
          process.env.NEXT_PUBLIC_APP_URL || "https://buildxpert.ie"
        }/unsubscribe?email=${encodeURIComponent(contact.email)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    // Update contact status to RESPONDED
    await prisma.contact.update({
      where: { id: contactId },
      data: { status: "RESPONDED" as ContactStatus },
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
