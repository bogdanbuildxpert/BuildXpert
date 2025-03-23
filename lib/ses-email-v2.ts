import AWS from "aws-sdk";

// Create an SES client using AWS SDK v2
const ses = new AWS.SES({
  apiVersion: "2010-12-01",
  region: "eu-west-1",
  // Let AWS SDK use credentials from environment variables or AWS credentials file
  // This is more robust than hardcoding credentials
});

interface EmailParams {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

/**
 * Send an email using AWS SES API (SDK v2)
 */
export async function sendEmailWithSesApiV2({
  to,
  subject,
  htmlBody,
  textBody,
  from = process.env.EMAIL_FROM,
  fromName = process.env.EMAIL_FROM_NAME,
  replyTo,
}: EmailParams) {
  // Build the email addresses
  const toAddresses = Array.isArray(to) ? to : [to];
  const fromAddress = fromName ? `${fromName} <${from}>` : from;

  // Create email parameters
  const params: AWS.SES.SendEmailRequest = {
    Source: fromAddress || "",
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
      },
    },
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
  };

  console.log(`Sending email via SES API v2 to ${toAddresses.join(", ")}`);

  try {
    // Send the email using AWS SDK v2
    const result = await ses.sendEmail(params).promise();
    console.log("Email sent successfully with SES API v2:", result.MessageId);
    return result;
  } catch (error: any) {
    console.error("Error sending email with SES API v2:", error);

    // Log details for debugging
    if (error.code === "SignatureDoesNotMatch") {
      console.error("Signature mismatch - this could be due to:");
      console.error("1. Issues with credentials");
      console.error("2. Time synchronization");
      console.error("3. Missing permissions");
    }

    throw error;
  }
}

/**
 * Send password reset email using SES API v2
 */
export async function sendPasswordResetEmailWithSesApiV2(
  to: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  // Try sending with up to 3 retries
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Sending password reset email via SES API v2 to ${to} (attempt ${attempt})`
      );

      const subject = "Reset Your BuildXpert Password";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          <p>We received a request to reset your password for your BuildXpert account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can also copy and paste this link into your browser:
            <br>
            <a href="${resetLink}" style="color: #0070f3; word-break: break-all;">${resetLink}</a>
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} BuildXpert. All rights reserved.</p>
          </div>
        </div>
      `;
      const textBody = `Reset your BuildXpert password by clicking this link: ${resetLink}. This link will expire in 1 hour.`;

      const result = await sendEmailWithSesApiV2({
        to,
        subject,
        htmlBody,
        textBody,
      });

      console.log(`Password reset email sent successfully to ${to}`, {
        messageId: result.MessageId,
      });

      return result;
    } catch (error: any) {
      console.error(
        `Error sending password reset email via SES API v2 (attempt ${attempt}):`,
        error
      );

      // If it's the last attempt, throw the error
      if (attempt === 3) {
        throw new Error(
          "Failed to send password reset email after multiple attempts"
        );
      }

      // Otherwise wait a second before trying again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Send verification email using SES API v2
 */
export async function sendVerificationEmailWithSesApiV2(
  to: string,
  token: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationLink = `${appUrl}/verify-email?token=${token}`;

  // Try sending with up to 3 retries
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Sending verification email via SES API v2 to ${to} (attempt ${attempt})`
      );

      const subject = "Verify your BuildXpert account";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} BuildXpert. All rights reserved.</p>
          </div>
        </div>
      `;
      const textBody = `Welcome to BuildXpert! Please verify your email by clicking this link: ${verificationLink}`;

      const result = await sendEmailWithSesApiV2({
        to,
        subject,
        htmlBody,
        textBody,
      });

      console.log(`Verification email sent successfully to ${to}`, {
        messageId: result.MessageId,
      });

      return result;
    } catch (error: any) {
      console.error(
        `Error sending verification email via SES API v2 (attempt ${attempt}):`,
        error
      );

      // If it's the last attempt, throw the error
      if (attempt === 3) {
        throw new Error(
          "Failed to send verification email after multiple attempts"
        );
      }

      // Otherwise wait a second before trying again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
