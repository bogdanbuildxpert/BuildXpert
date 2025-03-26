import { transporter } from "@/lib/email";
import {
  isEmailSuppressed,
  getEmailStatus,
  handleSMTPError,
} from "./email-bounce";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: {
    name?: string;
    address: string;
  };
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send an email safely with bounce handling and pre-send checks
 */
export async function sendEmailSafely(options: EmailOptions) {
  try {
    const { to } = options;

    // Handle array of recipients
    if (Array.isArray(to)) {
      const results = await Promise.all(
        to.map((recipient) =>
          sendSingleEmailSafely({ ...options, to: recipient })
        )
      );

      // Return success if at least one email was sent successfully
      const anySuccess = results.some((result) => result.success);
      return {
        success: anySuccess,
        results,
      };
    }

    return await sendSingleEmailSafely(options);
  } catch (error) {
    console.error("Error in sendEmailSafely:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a single email with bounce handling
 */
async function sendSingleEmailSafely(options: EmailOptions) {
  const { to } = options;
  const recipient = to as string; // We know it's a string at this point

  try {
    // 1. Validate email format
    if (!isValidEmailFormat(recipient)) {
      console.warn(`Invalid email format: ${recipient}`);
      return {
        success: false,
        error: "Invalid email format",
        recipient,
      };
    }

    // 2. Check bounce status
    const emailStatus = await getEmailStatus(recipient);

    // 3. If hard bounced (suppressed), don't send
    if (emailStatus.isSuppressed) {
      console.warn(
        `Email ${recipient} is suppressed due to previous hard bounce, skipping send`
      );
      return {
        success: false,
        error: "Email address is suppressed due to previous hard bounce",
        recipient,
        bounceInfo: emailStatus.latestBounce,
      };
    }

    // 4. If in backoff period due to soft bounce, don't send
    if (emailStatus.isInBackoff) {
      const retryAfter = emailStatus.retryAfter;
      console.warn(
        `Email ${recipient} is in soft bounce backoff period until ${retryAfter}`
      );
      return {
        success: false,
        error: "Email address is in backoff period due to previous soft bounce",
        recipient,
        retryAfter,
        bounceInfo: emailStatus.latestBounce,
      };
    }

    // 5. Send the email
    const info = await transporter.sendMail({
      ...options,
      to: recipient,
    });

    console.log(
      `Email sent successfully to ${recipient}. Message ID: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId,
      recipient,
    };
  } catch (error) {
    console.error(`Error sending email to ${recipient}:`, error);

    // Handle the SMTP error
    await handleSMTPError(recipient, error);

    return {
      success: false,
      error: error.message,
      errorCode: error.responseCode || error.code,
      recipient,
    };
  }
}

/**
 * Validate email format with a reasonable regex
 */
function isValidEmailFormat(email: string): boolean {
  // Basic email format validation - RFC 5322 compliant
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}
