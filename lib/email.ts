import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

// Create email transporter with increased timeouts for AWS SES
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 45000, // 45 seconds
  debug: process.env.NODE_ENV !== "production", // Enable debug logging in non-production
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

// Verify transporter connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

const createEmailLayout = (content: string, unsubscribeLink?: string) => {
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
            ${
              unsubscribeLink
                ? `<p><a href="${unsubscribeLink}" style="color: #666; text-decoration: underline;">Unsubscribe</a> from these emails.</p>`
                : ""
            }
            <p>This is a transactional email related to your interaction with BuildXpert.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export async function getProcessedTemplate(
  templateName: string,
  replacements: Record<string, string>
): Promise<{ subject: string; content: string }> {
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

export const sendVerificationEmail = async (to: string, token: string) => {
  const appUrl = getAppUrl();
  const verificationLink = `${appUrl}/verify-email?token=${token}`;

  // Try sending with primary method up to 2 retries
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Sending verification email to ${to} (attempt ${attempt})`);

      // Try to get template from database
      let subject = "Verify your BuildXpert account";
      let content = "";

      try {
        const template = await getProcessedTemplate("email_verification", {
          verificationLink,
        });
        subject = template.subject;
        content = template.content;
      } catch (templateError) {
        console.error(
          "Could not load email template, using fallback:",
          templateError
        );
        // Use fallback template if database template fails
        content = `
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to BuildXpert!</h2>
          <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can also copy and paste this link into your browser:
            <br>
            <a href="${verificationLink}" style="color: #0070f3; word-break: break-all;">${verificationLink}</a>
          </p>
        `;
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || "BuildXpert",
          address:
            process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "",
        },
        to,
        subject,
        text: `Welcome to BuildXpert! Please verify your email by clicking this link: ${verificationLink}`,
        html: createEmailLayout(content),
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Verification email sent successfully to ${to}`, {
        messageId: result.messageId,
      });
      return result;
    } catch (error: any) {
      console.error(
        `Error sending verification email (attempt ${attempt}):`,
        error
      );

      // Check for specific errors
      if (
        error.code === "ETIMEDOUT" ||
        error.code === "ESOCKET" ||
        error.code === "ECONNECTION"
      ) {
        console.error(
          "Email server connection timeout. Please check your SMTP settings and server status."
        );
      }

      // If it's the last attempt, throw the error
      if (attempt === 3) {
        throw new Error(
          "Failed to send verification email after multiple attempts"
        );
      }

      // Otherwise wait before trying again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

export const sendContactConfirmationEmail = async (
  to: string,
  firstName: string,
  subject: string
) => {
  try {
    const { subject: emailSubject, content } = await getProcessedTemplate(
      "contact_confirmation",
      {
        name: firstName,
        subject,
        date: new Date().toLocaleString(),
      }
    );

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || "BuildXpert Support",
        address: process.env.EMAIL_SERVER_USER || "",
      },
      to,
      subject: emailSubject,
      text: `Thank you for contacting BuildXpert! We have received your message regarding "${subject}" and will respond within 1-2 business days.`,
      html: createEmailLayout(content),
      replyTo: process.env.EMAIL_SERVER_USER || "",
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending contact confirmation email:", error);
    // Fallback to hardcoded template if database template fails
    const content = `
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

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || "BuildXpert Support",
        address: process.env.EMAIL_SERVER_USER || "",
      },
      to,
      subject: "We received your message - BuildXpert",
      text: `Thank you for contacting BuildXpert! We have received your message regarding "${subject}" and will respond within 1-2 business days.`,
      html: createEmailLayout(content),
      replyTo: process.env.EMAIL_SERVER_USER || "",
    };

    await transporter.sendMail(mailOptions);
  }
};

export const sendContactNotificationEmail = async (contactData: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  preferredContact?: string;
}) => {
  const { name, email, phone, subject, message, preferredContact } =
    contactData;

  try {
    const appUrl = getAppUrl();
    const adminUrl = `${appUrl}/admin/contacts`;
    const { subject: emailSubject, content } = await getProcessedTemplate(
      "contact_notification",
      {
        name,
        email,
        phone: phone || "Not provided",
        subject,
        message: message.replace(/\n/g, "<br>"),
        preferredContact: preferredContact === "PHONE" ? "Phone" : "Email",
        date: new Date().toLocaleString(),
        adminUrl,
      }
    );

    const mailOptions = {
      from: {
        name: "BuildXpert Notifications",
        address: process.env.EMAIL_SERVER_USER || "",
      },
      to: process.env.ADMIN_EMAIL || "bogdan@buildxpert.ie",
      subject: emailSubject,
      text: `New contact form submission from ${name} (${email}). Subject: ${subject}`,
      html: createEmailLayout(content),
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending contact notification email:", error);
    // Fallback to hardcoded template if database template fails
    const appUrl = getAppUrl();
    const adminUrl = `${appUrl}/admin/contacts`;
    const content = `
      <h2 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h2>
      <p>A new contact form has been submitted on the BuildXpert website.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Contact Details:</h3>
        <p><strong>Name:</strong> ${name}</p>
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

    const mailOptions = {
      from: {
        name: "BuildXpert Notifications",
        address: process.env.EMAIL_SERVER_USER || "",
      },
      to: process.env.ADMIN_EMAIL || "bogdan@buildxpert.ie",
      subject: `New Contact Form Submission: ${subject}`,
      text: `New contact form submission from ${name} (${email}). Subject: ${subject}`,
      html: createEmailLayout(content),
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const appUrl = getAppUrl();
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  // Try sending with primary method up to 2 retries
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Sending password reset email to ${to} (attempt ${attempt})`);

      // Try to get template from database
      let subject = "Reset Your BuildXpert Password";
      let content = "";

      try {
        const template = await getProcessedTemplate("password_reset", {
          resetLink,
        });
        subject = template.subject;
        content = template.content;
      } catch (templateError) {
        console.error(
          "Could not load email template, using fallback:",
          templateError
        );
        // Use fallback template if database template fails
        content = `
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          <p>We received a request to reset your password for your BuildXpert account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can also copy and paste this link into your browser:
            <br>
            <a href="${resetLink}" style="color: #0070f3; word-break: break-all;">${resetLink}</a>
          </p>
        `;
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || "BuildXpert Support",
          address:
            process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "",
        },
        to,
        subject,
        text: `Reset your BuildXpert password by clicking this link: ${resetLink}. This link will expire in 1 hour.`,
        html: createEmailLayout(content),
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent successfully to ${to}`, {
        messageId: result.messageId,
      });
      return result;
    } catch (error: any) {
      console.error(
        `Error sending password reset email (attempt ${attempt}):`,
        error
      );

      // Check for specific errors
      if (
        error.code === "ETIMEDOUT" ||
        error.code === "ESOCKET" ||
        error.code === "ECONNECTION"
      ) {
        console.error(
          "Email server connection timeout. Please check your SMTP settings and server status."
        );
      }

      // If it's the last attempt, throw the error
      if (attempt === 3) {
        throw new Error(
          "Failed to send password reset email after multiple attempts"
        );
      }

      // Otherwise wait before trying again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};
