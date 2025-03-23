// Test script for AWS SES API with new credentials
require("dotenv").config(); // Load environment variables

// Import the AWS SDK
const AWS = require("aws-sdk");

// Get credentials from .env file
const accessKeyId = process.env.EMAIL_SERVER_USER;
const secretAccessKey = process.env.EMAIL_SERVER_PASSWORD;

console.log("Testing with new credentials:");
console.log(
  "Access Key ID:",
  accessKeyId ? accessKeyId.substring(0, 5) + "..." : "Not set"
);
console.log("Secret Access Key:", secretAccessKey ? "********" : "Not set");

// Configure AWS with credentials
AWS.config.update({
  region: "eu-west-1",
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

// Create SES client
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

async function runTests() {
  console.log("-------------------------------------");
  console.log("1. Testing SES Get Send Quota API call");
  console.log("-------------------------------------");

  try {
    const quotaData = await ses.getSendQuota().promise();
    console.log("SUCCESS: SES Get Send Quota API call worked!");
    console.log("Daily quota:", quotaData.Max24HourSend);
    console.log("Sent in last 24h:", quotaData.SentLast24Hours);
    console.log("Max send rate:", quotaData.MaxSendRate, "per second");
  } catch (error) {
    console.error("FAILED: SES Get Send Quota API call failed:", error.message);
  }

  console.log("\n-------------------------------------");
  console.log("2. Testing SES Send Email API call");
  console.log("-------------------------------------");

  // Set up email parameters
  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: ["bogdan@buildxpert.ie"], // Use your verified email
    },
    Message: {
      Subject: {
        Data: "Test Email with New Credentials",
      },
      Body: {
        Text: {
          Data:
            "This is a test email sent from Node.js using new AWS credentials at " +
            new Date().toISOString(),
        },
        Html: {
          Data: `
            <h2>Test Email with New Credentials</h2>
            <p>This is a test email sent from Node.js using new AWS credentials.</p>
            <p>Time: ${new Date().toISOString()}</p>
          `,
        },
      },
    },
  };

  try {
    const emailData = await ses.sendEmail(params).promise();
    console.log("SUCCESS: Email sent successfully!");
    console.log("Message ID:", emailData.MessageId);
  } catch (error) {
    console.error("FAILED: Email sending failed:", error.message);
  }
}

// Run all tests
runTests()
  .then(() => console.log("\nAll tests completed."))
  .catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  });
