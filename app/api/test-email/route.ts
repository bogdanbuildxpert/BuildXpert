import { NextResponse } from "next/server";

async function sendTestEmail(to: string) {
  console.log("TEST_EMAIL: Starting email send process for", to);
  try {
    // Create a direct import of the nodemailer module
    const nodemailer = require("nodemailer");
    console.log("TEST_EMAIL: Required nodemailer module");

    // Create transporter
    console.log("TEST_EMAIL: Creating transporter with settings:", {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: process.env.EMAIL_SERVER_SECURE,
      auth: {
        user: process.env.EMAIL_SERVER_USER ? "CONFIGURED" : "MISSING",
        pass: process.env.EMAIL_SERVER_PASSWORD ? "CONFIGURED" : "MISSING",
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      secure: process.env.EMAIL_SERVER_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    console.log("TEST_EMAIL: Transporter created");

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "",
      to,
      subject: "BuildXpert Test Email",
      text: "This is a test email from BuildXpert",
      html: "<p>This is a test email from BuildXpert</p>",
    };

    console.log("TEST_EMAIL: Mail options ready, now sending:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log(`TEST_EMAIL: Email sent successfully to ${to}`, {
      messageId: result.messageId,
    });

    return {
      success: true,
      messageId: result.messageId || null,
    };
  } catch (error: any) {
    console.error(`TEST_EMAIL: Error sending email:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter is required" },
      { status: 400 }
    );
  }

  console.log(`TEST_EMAIL ROUTE: Sending test email to ${email}`);
  try {
    const result = await sendTestEmail(email);
    console.log(`TEST_EMAIL ROUTE: Result:`, result);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error(`TEST_EMAIL ROUTE: Error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
