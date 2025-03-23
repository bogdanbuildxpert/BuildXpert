// Test script for email functionality
require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
  // Log the email configuration for debugging
  console.log("Email configuration:");
  console.log("HOST:", process.env.EMAIL_SERVER);
  console.log("PORT:", process.env.EMAIL_SERVER_PORT);
  console.log("SECURE:", process.env.EMAIL_SERVER_SECURE);
  console.log(
    "USER:",
    process.env.EMAIL_SERVER_USER ? "✓ Configured" : "✗ Missing"
  );
  console.log(
    "PASSWORD:",
    process.env.EMAIL_SERVER_PASSWORD ? "✓ Configured" : "✗ Missing"
  );
  console.log("FROM EMAIL:", process.env.EMAIL_FROM);
  console.log("FROM NAME:", process.env.EMAIL_FROM_NAME);

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    secure: process.env.EMAIL_SERVER_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  // Verify connection
  try {
    const verification = await transporter.verify();
    console.log("SMTP connection verified successfully:", verification);

    // Send a test email
    const info = await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || "BuildXpert",
        address: process.env.EMAIL_FROM,
      },
      to: "bogdanhutuleac@outlook.com",
      subject: "Test Email from BuildXpert via SendGrid",
      text: "This is a test email sent from the BuildXpert application using SendGrid.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
          <h1 style="color: #333;">Test Email from BuildXpert</h1>
          <p>This is a test email sent from the BuildXpert application using SendGrid.</p>
          <p>If you're receiving this, your email configuration is working correctly!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>BuildXpert - Professional Painting Services</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
