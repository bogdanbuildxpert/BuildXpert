// Set up AWS credentials and test both SMTP and API access
require("dotenv").config();
const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");

// Test credentials from environment variables
const accessKeyId = process.env.EMAIL_SERVER_USER;
const secretKey = process.env.EMAIL_SERVER_PASSWORD;
const region = "eu-west-1";

console.log("=== AWS Credentials Test ===");
console.log(
  "Access Key ID:",
  accessKeyId ? accessKeyId.substring(0, 5) + "..." : "Not found"
);
console.log("Secret Key Length:", secretKey ? secretKey.length : "Not found");
console.log("Region:", region);

// Explicitly configure AWS with credentials
AWS.config.update({
  region: region,
  accessKeyId: accessKeyId,
  secretAccessKey: secretKey,
});

// Create an SES service object
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

// Set up SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT || 587),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: accessKeyId,
    pass: secretKey,
  },
  debug: true,
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 90000,
});

// Run all tests in sequence
async function runAllTests() {
  try {
    // Test 1: Basic AWS Credentials test
    console.log("\n=== TEST 1: Basic AWS Credentials Verification ===");
    const sts = new AWS.STS();
    try {
      const identity = await sts.getCallerIdentity().promise();
      console.log("AWS Credentials Valid! Identity:", identity.Arn);
    } catch (err) {
      console.error("AWS Credentials Invalid:", err.message);
    }

    // Test 2: Check SMTP connection
    console.log("\n=== TEST 2: SMTP Connection Test ===");
    try {
      const smtpResult = await transporter.verify();
      console.log("SMTP Connection Successful:", smtpResult);
    } catch (err) {
      console.error("SMTP Connection Failed:", err.message);
    }

    // Test 3: Send email via SMTP
    console.log("\n=== TEST 3: SMTP Email Sending Test ===");
    try {
      const smtpEmail = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: "bogdan@buildxpert.ie", // Use your verified email
        subject: "Test Email via SMTP",
        text:
          "This is a test email sent via SMTP at " + new Date().toISOString(),
        html: `<p>This is a test email sent via SMTP at ${new Date().toISOString()}</p>`,
      });
      console.log("SMTP Email Sent Successfully:", smtpEmail.messageId);
    } catch (err) {
      console.error("SMTP Email Failed:", err.message);
    }

    // Test 4: SES API Call
    console.log("\n=== TEST 4: SES API Call Test ===");
    try {
      const quotaData = await ses.getSendQuota().promise();
      console.log("SES API Call Successful!");
      console.log("Daily Quota:", quotaData.Max24HourSend);
      console.log("Sent in Last 24h:", quotaData.SentLast24Hours);
    } catch (err) {
      console.error("SES API Call Failed:", err.message);
    }

    // Test 5: Send email via SES API
    console.log("\n=== TEST 5: SES API Email Sending Test ===");
    try {
      const emailResult = await ses
        .sendEmail({
          Source: process.env.EMAIL_FROM,
          Destination: {
            ToAddresses: ["bogdan@buildxpert.ie"], // Use your verified email
          },
          Message: {
            Subject: {
              Data: "Test Email via SES API",
            },
            Body: {
              Text: {
                Data:
                  "This is a test email sent via SES API at " +
                  new Date().toISOString(),
              },
              Html: {
                Data: `<p>This is a test email sent via SES API at ${new Date().toISOString()}</p>`,
              },
            },
          },
        })
        .promise();
      console.log("SES API Email Sent Successfully:", emailResult.MessageId);
    } catch (err) {
      console.error("SES API Email Failed:", err.message);
    }

    console.log("\n=== All Tests Completed ===");
  } catch (err) {
    console.error("Test Suite Error:", err);
  }
}

// Run the tests
runAllTests();
