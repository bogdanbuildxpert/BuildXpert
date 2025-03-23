// Test script for AWS SES API v2 email sending
require("dotenv").config(); // Load environment variables

// Import the AWS SDK directly
const AWS = require("aws-sdk");

// Setup AWS credentials with proper escaping
const accessKeyId = process.env.EMAIL_SERVER_USER?.trim();
const secretAccessKey = process.env.EMAIL_SERVER_PASSWORD?.trim();

console.log("Testing with credentials:");
console.log(
  "Access Key ID:",
  accessKeyId ? accessKeyId.substring(0, 5) + "..." : "Not set"
);
console.log("Secret length:", secretAccessKey ? secretAccessKey.length : 0);

// Configure AWS with credentials
AWS.config.update({
  region: "eu-west-1",
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  correctClockSkew: true,
});

// Create SES client
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

async function sendTestEmail() {
  const testEmail = process.argv[2] || "bogdan@buildxpert.ie"; // Use the verified email

  console.log(`Sending test email to: ${testEmail}`);

  // Prepare email params
  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [testEmail],
    },
    Message: {
      Subject: {
        Data: "AWS SES Test from SDK v2",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <h1>AWS SES Test</h1>
            <p>This is a test email sent from AWS SES using SDK v2.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `AWS SES Test\nThis is a test email sent from AWS SES using SDK v2.\nTimestamp: ${new Date().toISOString()}`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    console.log("Sending email...");
    const result = await ses.sendEmail(params).promise();
    console.log("Email sent successfully!");
    console.log("Message ID:", result.MessageId);
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    if (error.code === "SignatureDoesNotMatch") {
      console.error("Signature mismatch issue detected.");
      console.error("This may be due to:");
      console.error("1. Special characters in AWS secret keys");
      console.error("2. Time synchronization issues");
      console.error("3. Incorrectly copied credentials");
    }
    throw error;
  }
}

// Run the test
sendTestEmail()
  .then(() => console.log("Test complete!"))
  .catch((err) => {
    console.error("Test failed with error:", err.message);
    process.exit(1);
  });
