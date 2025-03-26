import { prisma } from "@/lib/prisma";
import type { BounceStatus, BounceType } from "@prisma/client";

interface BounceData {
  email: string;
  messageId?: string;
  bounceType?: BounceType;
  bounceCategory?: string;
  reason?: string;
  action?: string;
  diagnosticCode?: string;
  retryAfter?: Date;
}

/**
 * Log a bounced email to the database
 */
export async function logBounce(bounceData: BounceData) {
  try {
    const {
      email,
      messageId,
      bounceType = "UNDETERMINED",
      bounceCategory,
      reason,
      action,
      diagnosticCode,
      retryAfter,
    } = bounceData;

    // Check if we already have a record for this email
    const existingBounce = await prisma.emailBounce.findFirst({
      where: { email },
      orderBy: { timestamp: "desc" },
    });

    // For existing records, update with new information
    if (existingBounce) {
      return await prisma.emailBounce.update({
        where: { id: existingBounce.id },
        data: {
          messageId: messageId || existingBounce.messageId,
          bounceType: bounceType as BounceType,
          bounceCategory: bounceCategory || existingBounce.bounceCategory,
          reason: reason || existingBounce.reason,
          action: action || existingBounce.action,
          diagnosticCode: diagnosticCode || existingBounce.diagnosticCode,
          retryCount: existingBounce.retryCount + 1,
          timestamp: new Date(),
          status: "NEW" as BounceStatus,
          retryAfter: retryAfter || existingBounce.retryAfter,
        },
      });
    }

    // Create new record if it doesn't exist
    return await prisma.emailBounce.create({
      data: {
        email,
        messageId,
        bounceType: bounceType as BounceType,
        bounceCategory,
        reason,
        action,
        diagnosticCode,
        status: "NEW" as BounceStatus,
        retryAfter,
      },
    });
  } catch (error) {
    console.error("Error logging email bounce:", error);
    throw error;
  }
}

/**
 * Check if an email is in the suppression list (has a hard bounce)
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    // Check for hard bounces only
    const hardBounce = await prisma.emailBounce.findFirst({
      where: {
        email,
        bounceType: "HARD",
        // Don't suppress if the bounce was marked as ignored/resolved
        status: { notIn: ["IGNORED", "RESOLVED"] },
      },
    });

    return !!hardBounce;
  } catch (error) {
    console.error("Error checking email suppression:", error);
    // Default to false in case of error (allow sending)
    return false;
  }
}

/**
 * Get email status including bounce history and suppression status
 */
export async function getEmailStatus(email: string) {
  try {
    const bounces = await prisma.emailBounce.findMany({
      where: { email },
      orderBy: { timestamp: "desc" },
    });

    const latestBounce = bounces[0];

    const isHardBounced = bounces.some(
      (bounce) =>
        bounce.bounceType === "HARD" &&
        bounce.status !== "IGNORED" &&
        bounce.status !== "RESOLVED"
    );

    const isSoftBounced = bounces.some(
      (bounce) =>
        bounce.bounceType === "SOFT" &&
        bounce.status !== "IGNORED" &&
        bounce.status !== "RESOLVED"
    );

    const activeBouncesCount = bounces.filter(
      (bounce) => bounce.status !== "IGNORED" && bounce.status !== "RESOLVED"
    ).length;

    return {
      email,
      isHardBounced,
      isSoftBounced,
      isSuppressed: isHardBounced,
      isInBackoff:
        latestBounce?.retryAfter && latestBounce.retryAfter > new Date(),
      retryAfter: latestBounce?.retryAfter,
      bounceCount: activeBouncesCount,
      latestBounce,
      bounces,
    };
  } catch (error) {
    console.error("Error getting email status:", error);
    return {
      email,
      isHardBounced: false,
      isSoftBounced: false,
      isSuppressed: false,
      isInBackoff: false,
      bounceCount: 0,
      bounces: [],
    };
  }
}

/**
 * Handle a soft bounce by implementing a backoff strategy
 */
export async function handleSoftBounce(
  email: string,
  reason?: string,
  diagnosticCode?: string
) {
  try {
    const bounces = await prisma.emailBounce.findMany({
      where: {
        email,
        bounceType: "SOFT",
        status: { notIn: ["IGNORED", "RESOLVED"] },
      },
      orderBy: { timestamp: "desc" },
    });

    const bounceCount = bounces.length;

    // Implement exponential backoff
    // 1st soft bounce: 4 hours
    // 2nd soft bounce: 8 hours
    // 3rd soft bounce: 16 hours
    // 4th soft bounce: 32 hours
    // 5th+ soft bounce: 48 hours
    const backoffHours = bounceCount <= 4 ? Math.pow(2, bounceCount + 1) : 48;

    const retryAfter = new Date();
    retryAfter.setHours(retryAfter.getHours() + backoffHours);

    // If we've had 5+ soft bounces, treat as hard bounce
    if (bounceCount >= 5) {
      return await logBounce({
        email,
        bounceType: "HARD",
        reason: "Converted to hard bounce after 5 soft bounces",
        bounceCategory: "Persistent Soft Bounce",
        diagnosticCode,
      });
    }

    return await logBounce({
      email,
      bounceType: "SOFT",
      reason: reason || "Soft bounce detected",
      bounceCategory: "Temporary Failure",
      retryAfter,
      diagnosticCode,
    });
  } catch (error) {
    console.error("Error handling soft bounce:", error);
    throw error;
  }
}

/**
 * Handle a hard bounce by adding to suppression list
 */
export async function handleHardBounce(
  email: string,
  reason?: string,
  diagnosticCode?: string
) {
  try {
    // Log the hard bounce
    return await logBounce({
      email,
      bounceType: "HARD",
      reason: reason || "Hard bounce detected",
      bounceCategory: "Permanent Failure",
      diagnosticCode,
    });
  } catch (error) {
    console.error("Error handling hard bounce:", error);
    throw error;
  }
}

/**
 * Categorize SMTP error code into bounce type
 */
export function categorizeSMTPError(
  errorCode?: number,
  errorMessage?: string
): {
  bounceType: BounceType;
  reason: string;
} {
  // No error code provided
  if (!errorCode) {
    // Try to guess from error message
    if (errorMessage) {
      const message = errorMessage.toLowerCase();

      if (
        message.includes("no such user") ||
        message.includes("user unknown") ||
        message.includes("does not exist") ||
        message.includes("invalid recipient") ||
        message.includes("recipient rejected") ||
        message.includes("mailbox unavailable")
      ) {
        return { bounceType: "HARD", reason: "Recipient address rejected" };
      }

      if (
        message.includes("mailbox full") ||
        message.includes("over quota") ||
        message.includes("temporarily unavailable")
      ) {
        return {
          bounceType: "SOFT",
          reason: "Mailbox temporarily unavailable",
        };
      }

      return { bounceType: "UNDETERMINED", reason: "Unknown error" };
    }

    return { bounceType: "UNDETERMINED", reason: "Unknown error" };
  }

  // Convert to string for pattern matching
  const code = errorCode.toString();

  // 5xx SMTP codes are permanent errors (hard bounces)
  if (code.startsWith("5")) {
    switch (errorCode) {
      case 550:
        return { bounceType: "HARD", reason: "Mailbox not found" };
      case 551:
        return {
          bounceType: "HARD",
          reason: "User not local or invalid address",
        };
      case 552:
        return { bounceType: "SOFT", reason: "Mailbox storage exceeded" };
      case 553:
        return { bounceType: "HARD", reason: "Mailbox name invalid" };
      case 554:
        return { bounceType: "HARD", reason: "Transaction failed" };
      default:
        return { bounceType: "HARD", reason: `SMTP error ${errorCode}` };
    }
  }

  // 4xx SMTP codes are temporary errors (soft bounces)
  if (code.startsWith("4")) {
    switch (errorCode) {
      case 421:
        return { bounceType: "SOFT", reason: "Service not available" };
      case 450:
        return { bounceType: "SOFT", reason: "Mailbox unavailable" };
      case 451:
        return { bounceType: "SOFT", reason: "Processing error" };
      case 452:
        return { bounceType: "SOFT", reason: "Insufficient system storage" };
      default:
        return { bounceType: "SOFT", reason: `SMTP error ${errorCode}` };
    }
  }

  // Any other codes are treated as undetermined
  return {
    bounceType: "UNDETERMINED",
    reason: `Unknown SMTP error: ${errorCode}`,
  };
}

/**
 * Handle SMTP error by logging and categorizing
 */
export async function handleSMTPError(
  email: string,
  error: any
): Promise<void> {
  try {
    // Extract error code and message if available
    const errorCode = error.responseCode || error.code;
    const errorMessage = error.message || "";

    // Categorize the error
    const { bounceType, reason } = categorizeSMTPError(errorCode, errorMessage);

    // Handle based on bounce type
    if (bounceType === "HARD") {
      await handleHardBounce(email, reason, errorMessage);
    } else if (bounceType === "SOFT") {
      await handleSoftBounce(email, reason, errorMessage);
    } else {
      // Log undetermined bounces but don't take action
      await logBounce({
        email,
        bounceType: "UNDETERMINED",
        reason,
        diagnosticCode: errorMessage,
      });
    }
  } catch (error) {
    console.error("Error handling SMTP error:", error);
  }
}

/**
 * Remove an email from the suppression list
 */
export async function removeFromSuppressionList(email: string) {
  try {
    // Set all bounce records for this email to IGNORED
    await prisma.emailBounce.updateMany({
      where: { email },
      data: {
        status: "IGNORED" as BounceStatus,
        handled: true,
      },
    });

    return true;
  } catch (error) {
    console.error("Error removing from suppression list:", error);
    return false;
  }
}
