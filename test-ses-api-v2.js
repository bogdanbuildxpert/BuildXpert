// Test script for AWS SES API email sending using AWS SDK v2
require("dotenv").config(); // Load environment variables

const AWS = require("aws-sdk");

// Configure AWS SDK v2
AWS.config.update({
  region: "eu-west-1",
  accessKeyId: process.env.EMAIL_SERVER_USER,
  secretAccessKey: process.env.EMAIL_SERVER_PASSWORD,
});

// Create an SES client using AWS SDK v2
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

async function sendTestEmail() {
  const testEmail = process.argv[2] || "bogdan@buildxpert.ie"; // Default to the verified sandbox email

  if (!testEmail) {
    console.error("Please provide a test email address as argument");
    console.error("Example: node test-ses-api-v2.js test@example.com");
    process.exit(1);
  }

  console.log(`Testing AWS SES API (SDK v2) with the following configuration:`);
  console.log(`AWS Region: eu-west-1`);
  console.log(
    `Access Key ID: ${
      process.env.EMAIL_SERVER_USER
        ? process.env.EMAIL_SERVER_USER.substring(0, 5) + "..."
        : "Not set"
    }`
  );
  console.log(
    `Secret Access Key: ${
      process.env.EMAIL_SERVER_PASSWORD ? "*****" : "Not set"
    }`
  );
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
        Data: "BuildXpert - SES API Test Email (SDK v2)",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">AWS SES API Test (SDK v2)</h2>
              <p>This is a test email sent from AWS SES API using SDK v2 to verify email sending functionality.</p>
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
          Data: `AWS SES API Test Email\n\nThis is a test email sent from AWS SES API using SDK v2 to verify email sending functionality.\n\nIf you're receiving this, it means your SES API configuration is working correctly!\n\nTime sent: ${new Date().toISOString()}`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    // Send the email using the older SDK
    const result = await ses.sendEmail(params).promise();
    console.log("Test email sent successfully!");
    console.log("Message ID:", result.MessageId);
    return result;
  } catch (error) {
    console.error("Error sending test email:", error);
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
