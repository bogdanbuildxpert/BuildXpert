// Import necessary modules for sending emails
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create email transporter with SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT || 465),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 60000, // 60 seconds
  socketTimeout: 120000, // 120 seconds
  debug: true, // Enable debug logging
  logger: true, // Enable logger
});

// Verify transporter connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("[email.js] Email transporter verification failed:", error);

    // Log additional details for troubleshooting
    console.error("[email.js] Email server settings:", {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: process.env.EMAIL_SERVER_SECURE === "true",
      user: process.env.EMAIL_SERVER_USER
        ? process.env.EMAIL_SERVER_USER.substring(0, 5) + "..."
        : "Not set",
      hasPassword: !!process.env.EMAIL_SERVER_PASSWORD,
      env: process.env.NODE_ENV,
    });
  } else {
    console.log("[email.js] Email server is ready to send messages");
  }
});

// Helper to get the application URL from environment variables
function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  // Default to localhost in development
  if (!appUrl) {
    return process.env.NODE_ENV === "production"
      ? "https://buildxpert.ie"
      : "http://localhost:3000";
  }

  return appUrl;
}

// Create a consistent email layout wrapper
function createEmailLayout(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BuildXpert Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        .header img {
          max-width: 180px;
          height: auto;
        }
        .content {
          padding: 20px 0;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eaeaea;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #0070f3; margin: 0;">BuildXpert</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} BuildXpert. All rights reserved.</p>
          <p>Ireland's leading building contractor platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send verification email with fallback template
const sendVerificationEmail = async (to, token) => {
  const appUrl = getAppUrl();
  const verificationLink = `${appUrl}/verify-email?token=${token}`;

  // Debug logging
  console.log(`[EMAIL_DEBUG] Generated verification email for ${to}`);
  console.log(`[EMAIL_DEBUG] App URL: ${appUrl}`);
  console.log(`[EMAIL_DEBUG] Verification link: ${verificationLink}`);
  console.log(`[EMAIL_DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(
    `[EMAIL_DEBUG] Email server: ${process.env.EMAIL_SERVER_HOST}:${process.env.EMAIL_SERVER_PORT}`
  );

  // Define result structure
  const results = {
    attempts: 0,
    success: false,
    error: null,
    messageId: null,
  };

  // Try sending with up to 2 retries
  for (let attempt = 1; attempt <= 3; attempt++) {
    results.attempts = attempt;
    try {
      console.log(`Sending verification email to ${to} (attempt ${attempt})`);

      // Use hardcoded template (no JSON parsing required)
      const subject = "Verify your BuildXpert account";
      const content = `
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to BuildXpert!</h2>
        <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
          <br>
          <a href="${verificationLink}" style="color: #0070f3; word-break: break-all;">${verificationLink}</a>
        </p>
      `;

      // Send email directly using nodemailer
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || "BuildXpert",
          address:
            process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "",
        },
        to,
        subject,
        text: `Verify your BuildXpert account: ${verificationLink}`,
        html: createEmailLayout(content),
      };

      // Send the email
      const info = await transporter.sendMail(mailOptions);

      console.log(`Verification email sent successfully to ${to}`, {
        messageId: info.messageId,
      });

      results.success = true;
      results.messageId = info.messageId || null;
      return results;
    } catch (error) {
      console.error(
        `Error sending verification email (attempt ${attempt}):`,
        error
      );

      results.error = {
        message: error.message,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
      };

      // If it's the last attempt, return the error details
      if (attempt === 3) {
        console.error(
          "Failed to send verification email after multiple attempts:",
          results
        );
        return results;
      }

      // Otherwise wait before trying again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
};

// Export the functions for use in other modules
module.exports = {
  transporter,
  getAppUrl,
  createEmailLayout,
  sendVerificationEmail,
};
