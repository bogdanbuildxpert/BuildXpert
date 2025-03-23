// Test script to verify AWS SES configuration
require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
  console.log("Testing AWS SES email configuration...");
  console.log("Environment variables:");
  console.log(`- EMAIL_SERVER_HOST: ${process.env.EMAIL_SERVER_HOST}`);
  console.log(`- EMAIL_SERVER_PORT: ${process.env.EMAIL_SERVER_PORT}`);
  console.log(`- EMAIL_SERVER_SECURE: ${process.env.EMAIL_SERVER_SECURE}`);
  console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`- EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME}`);

  // Create transporter with same settings as in application
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: process.env.EMAIL_SERVER_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true, // Log information about the mail
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 45000, // 45 seconds
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });

  // Verify connection configuration
  try {
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully");
  } catch (error) {
    console.error("SMTP verification failed:", error);
    process.exit(1);
  }

  // Send test email
  try {
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || "AWS SES Test",
        address: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      },
      to: process.env.ADMIN_EMAIL || "bogdan@buildxpert.ie",
      subject: "AWS SES Test Email",
      text: "This is a test email to verify AWS SES configuration.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2>AWS SES Test Email</h2>
          <p>This is a test email sent at ${new Date().toLocaleString()}.</p>
          <p>If you're receiving this email, your AWS SES configuration is working correctly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated test email. Please do not reply.
          </p>
        </div>
      `,
    });

    console.log("Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Failed to send test email:", error);
    process.exit(1);
  }
}

main().catch(console.error);
