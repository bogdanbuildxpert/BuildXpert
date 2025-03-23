require("dotenv").config();
const { sendTestEmail } = require("../lib/sendgrid");

// Verify that the API key is configured
console.log("SendGrid configuration:");
console.log(
  "API KEY:",
  process.env.SENDGRID_API_KEY ? "✓ Configured" : "✗ Missing"
);
console.log("FROM EMAIL:", process.env.EMAIL_FROM);
console.log("FROM NAME:", process.env.EMAIL_FROM_NAME);

// Test recipient
const testEmail = "bogdanhutuleac@outlook.com";

// Send a test email
console.log(`\nSending test email to ${testEmail}...`);
sendTestEmail(testEmail)
  .then((response) => {
    console.log("✓ Email sent successfully via SendGrid API!");
    console.log("- Status Code:", response[0].statusCode);
    console.log("- Headers:", JSON.stringify(response[0].headers, null, 2));
  })
  .catch((error) => {
    console.error("✗ Failed to send email:", error.message);
  });
