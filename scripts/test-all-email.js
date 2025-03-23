require("dotenv").config();
const { sendTestEmail } = require("../lib/sendgrid"); // API method
const nodemailer = require("nodemailer"); // SMTP method

const testRecipient = "bogdanhutuleac@outlook.com";

async function main() {
  console.log("===== SendGrid Email Configuration Test =====\n");
  console.log("1. Testing SendGrid API method:");
  console.log("-----------------------------------------");
  console.log(
    "API KEY:",
    process.env.SENDGRID_API_KEY ? "✓ Configured" : "✗ Missing"
  );
  console.log("FROM EMAIL:", process.env.EMAIL_FROM);
  console.log("FROM NAME:", process.env.EMAIL_FROM_NAME);

  try {
    console.log(`\nSending test email via API to ${testRecipient}...`);
    const apiResponse = await sendTestEmail(testRecipient);
    console.log("✓ Email sent successfully via SendGrid API!");
    console.log("- Status Code:", apiResponse[0].statusCode);
  } catch (apiError) {
    console.error("✗ Failed to send email via API:", apiError.message);
  }

  console.log("\n\n2. Testing SMTP method:");
  console.log("-----------------------------------------");
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

  // Create SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    secure: process.env.EMAIL_SERVER_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    // Verify connection
    console.log("\nVerifying SMTP connection...");
    const verification = await transporter.verify();
    console.log("✓ SMTP connection verified:", verification);

    // Send test email
    console.log(`\nSending test email via SMTP to ${testRecipient}...`);
    const info = await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || "BuildXpert",
        address: process.env.EMAIL_FROM,
      },
      to: testRecipient,
      subject: "Test Email from BuildXpert via SendGrid SMTP",
      text: "This is a test email sent from the BuildXpert application using SendGrid SMTP.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
          <h1 style="color: #333;">Test Email from BuildXpert</h1>
          <p>This is a test email sent from the BuildXpert application using SendGrid SMTP.</p>
          <p>If you're receiving this, your SMTP configuration is working correctly!</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>BuildXpert - Professional Painting Services</p>
          </div>
        </div>
      `,
    });

    console.log("✓ Email sent successfully via SMTP!");
    console.log("- Message ID:", info.messageId);
  } catch (smtpError) {
    console.error("✗ Error with SMTP:", smtpError.message);
  }

  console.log("\n===== Test Complete =====");
}

main().catch(console.error);
