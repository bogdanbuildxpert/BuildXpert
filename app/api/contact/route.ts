import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// Import transporter only
import { transporter } from "@/lib/email";

// Mark this route as dynamic since it makes direct database calls
export const dynamic = "force-dynamic";

// Create a dedicated Prisma client for this route
const prisma = new PrismaClient();

// Helper function to create email layout
function createEmailLayout(content: string) {
  return `
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
            <h1 style="margin: 0; color: #333; font-size: 24px;">BuildXpert</h1>
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
            <p>This is a transactional email related to your interaction with BuildXpert.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Helper function to get the correct app URL
function getAppUrl(): string {
  // First, try to use NEXT_PUBLIC_APP_URL from environment
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  // If environment variables are set, use them
  if (appUrl) {
    return appUrl;
  }

  // In production, default to your custom domain
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return "https://buildxpert.ie";
  }

  // In development, use localhost
  return "http://localhost:3000";
}

// Simplified function to get email template content
async function getProcessedTemplate(
  templateName: string,
  replacements: Record<string, string>
) {
  try {
    // Find the email template in the database
    const template = await prisma.emailTemplate.findUnique({
      where: { name: templateName },
    });

    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }

    let { subject, content } = template;

    // Replace placeholders in subject and content
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    });

    return { subject, content };
  } catch (error) {
    console.error(`Error processing email template "${templateName}":`, error);
    throw error;
  }
}

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

    console.log("Creating contact entry in database:", { fullName, email });

    // Create contact entry in database
    try {
      const contactEntry = await prisma.contact.create({
        data: {
          name: fullName,
          email,
          phone: phone || null,
          message: `Subject: ${subject}\n\n${message}`,
          preferredContact: preferredContact || "EMAIL",
          status: "NEW",
        },
      });
      console.log("Contact entry created with ID:", contactEntry.id);
    } catch (dbError) {
      console.error("Database error creating contact:", dbError);
      return NextResponse.json(
        { error: "Failed to save contact information to database" },
        { status: 500 }
      );
    }

    // Send confirmation email to the user
    try {
      console.log("Attempting to send confirmation email to user:", email);

      // Try to get the template first
      let emailSubject = "Thank You for Contacting BuildXpert";
      let emailContent = "";

      try {
        const { subject: templateSubject, content } =
          await getProcessedTemplate("contact_confirmation", {
            name: firstName,
            subject,
            date: new Date().toLocaleString(),
          });
        emailSubject = templateSubject;
        emailContent = content;
      } catch (templateError) {
        console.error("Error loading email template:", templateError);
        // Fallback to hardcoded template
        emailContent = `
          <h2 style="color: #333; margin-bottom: 20px;">Thank You for Contacting Us!</h2>
          <p>Hello ${firstName},</p>
          <p>We have received your message regarding "${subject}". Thank you for reaching out to BuildXpert.</p>
          <p>Our team will review your inquiry and get back to you as soon as possible, typically within 1-2 business days.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Your request has been logged with the following details:</p>
            <p style="margin: 10px 0 0 0;">Subject: ${subject}</p>
            <p style="margin: 5px 0 0 0;">Date: ${new Date().toLocaleString()}</p>
          </div>
          <p>If you have any additional information to add to your inquiry, please reply to this email.</p>
          <p>Best regards,</p>
          <p><strong>The BuildXpert Team</strong></p>
        `;
      }

      // Use the transporter directly
      const mailOptions = {
        from: process.env.EMAIL_FROM_NAME
          ? `"${process.env.EMAIL_FROM_NAME}" <${
              process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || ""
            }>`
          : process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "",
        to: email,
        subject: emailSubject,
        text: `Thank you for contacting BuildXpert! We have received your message regarding "${subject}" and will respond within 1-2 business days.`,
        html: createEmailLayout(emailContent),
        replyTo: process.env.EMAIL_SERVER_USER || "",
        headers: {
          "List-Unsubscribe": `<${getAppUrl()}/unsubscribe?email=${encodeURIComponent(
            email
          )}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };

      const userEmailResult = await transporter.sendMail(mailOptions);
      console.log("Confirmation email sent to user:", email, {
        messageId: userEmailResult.messageId,
      });
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue with the process even if email fails
    }

    // Send notification email to admin
    try {
      console.log(
        "Attempting to send notification email to admin about contact from:",
        email
      );

      const appUrl = getAppUrl();
      const adminUrl = `${appUrl}/admin/contacts`;

      // Try to get the admin notification template
      let emailSubject = `New Contact Form Submission: ${subject}`;
      let emailContent = "";

      try {
        const templateResult = await getProcessedTemplate(
          "contact_notification",
          {
            name: fullName,
            email,
            phone: phone || "Not provided",
            subject,
            message: message.replace(/\n/g, "<br>"),
            preferredContact: preferredContact === "PHONE" ? "Phone" : "Email",
            date: new Date().toLocaleString(),
            adminUrl,
          }
        );
        emailSubject = templateResult.subject;
        emailContent = templateResult.content;
      } catch (templateError) {
        console.error("Error loading admin email template:", templateError);
        // Fall back to hardcoded template
        emailContent = `
          <h2 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h2>
          <p>A new contact form has been submitted on the BuildXpert website.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Details:</h3>
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Preferred Contact Method:</strong> ${
              preferredContact === "PHONE" ? "Phone" : "Email"
            }</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 10px; border-radius: 3px;">
              ${message.replace(/\n/g, "<br>")}
            </div>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>You can view and manage all contact submissions in the <a href="${adminUrl}" style="color: #0070f3;">admin dashboard</a>.</p>
        `;
      }

      const adminEmail = process.env.ADMIN_EMAIL || "bogdan@buildxpert.ie";
      console.log(`Sending notification email to admin: ${adminEmail}`);

      // Use the transporter directly for admin notification
      const adminMailOptions = {
        from: process.env.EMAIL_FROM_NAME
          ? `"${process.env.EMAIL_FROM_NAME}" <${
              process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || ""
            }>`
          : process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "",
        to: adminEmail,
        subject: emailSubject,
        text: `New contact form submission from ${fullName} (${email}). Subject: ${subject}`,
        html: createEmailLayout(emailContent),
        replyTo: email,
        headers: {
          "List-Unsubscribe": `<${getAppUrl()}/unsubscribe?email=${encodeURIComponent(
            adminEmail
          )}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };

      const adminEmailResult = await transporter.sendMail(adminMailOptions);
      console.log("Admin notification email sent successfully:", {
        messageId: adminEmailResult.messageId,
      });
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
      console.error("Error details:", JSON.stringify(emailError, null, 2));
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
