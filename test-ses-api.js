// Test script for AWS SES API email sending
require("dotenv").config(); // Load environment variables

const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// Clean up credentials to avoid special character issues
const accessKeyId = process.env.EMAIL_SERVER_USER?.trim();
const secretAccessKey = process.env.EMAIL_SERVER_PASSWORD?.trim();

// Make sure credentials are available
if (!accessKeyId || !secretAccessKey) {
  console.error("Error: AWS credentials not found in environment variables");
  console.error(
    "Please ensure EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD are set in your .env file"
  );
  process.exit(1);
}

// Initialize the SES client with explicit credentials from .env
const sesClient = new SESClient({
  region: "eu-west-1", // Match your AWS SES region
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function sendTestEmail() {
  const testEmail = process.argv[2]; // Get test email from command line argument

  if (!testEmail) {
    console.error("Please provide a test email address as argument");
    console.error("Example: node test-ses-api.js test@example.com");
    process.exit(1);
  }

  console.log(`Testing AWS SES API with the following configuration:`);
  console.log(`AWS Region: eu-west-1`);
  console.log(
    `Access Key ID: ${
      accessKeyId ? accessKeyId.substring(0, 5) + "..." : "Not set"
    }`
  );
  console.log(`Secret Access Key: ${secretAccessKey ? "********" : "Not set"}`);
  console.log(`From Email: ${process.env.EMAIL_FROM || "Not set"}`);
  console.log(`From Name: ${process.env.EMAIL_FROM_NAME || "Not set"}`);
  console.log(`Sending test email to: ${testEmail}`);

  // Create email parameters
  const params = {
    Source: process.env.EMAIL_FROM_NAME
      ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`
      : process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [testEmail],
    },
    Message: {
      Subject: {
        Data: "BuildXpert - SES API Test Email",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">AWS SES API Test</h2>
              <p>This is a test email sent from AWS SES API to verify email sending functionality.</p>
              <p>If you're receiving this, it means your SES API configuration is working correctly!</p>
              <p>Time sent: ${new Date().toISOString()}</p>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
                <p>&copy; ${new Date().getFullYear()} BuildXpert. All rights reserved.</p>
              </div>
            </div>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `AWS SES API Test Email\n\nThis is a test email sent from AWS SES API to verify email sending functionality.\n\nIf you're receiving this, it means your SES API configuration is working correctly!\n\nTime sent: ${new Date().toISOString()}`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    // Send the email and await the result
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log("Test email sent successfully!");
    console.log("Message ID:", result.MessageId);
    return result;
  } catch (error) {
    console.error("Error sending test email:", error);
    if (error.name === "SignatureDoesNotMatch") {
      console.error(
        "\nThis is likely due to special characters in your AWS credentials."
      );
      console.error(
        "Please check that your AWS access key and secret are properly formatted and don't have any extra spaces or special characters."
      );
    }
    throw error;
  }
}

// Run the test
sendTestEmail()
  .then(() => console.log("Test completed successfully"))
  .catch((err) => {
    console.error("Test failed:", err.message || "Unknown error");
    process.exit(1);
  });
