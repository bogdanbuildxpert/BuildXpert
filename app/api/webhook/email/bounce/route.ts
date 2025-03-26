import { NextRequest, NextResponse } from "next/server";
import {
  handleHardBounce,
  handleSoftBounce,
  logBounce,
} from "@/lib/services/email-bounce";

// Webhook secret for validation (add to .env)
const WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET || "";

/**
 * Generic webhook endpoint to handle bounce notifications from various SMTP providers
 *
 * Supports:
 * - Mailgun
 * - SendGrid
 * - Postmark
 * - Mailjet
 * - Generic format
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate the webhook secret if provided
    const authHeader = request.headers.get("authorization") || "";
    const providedSecret = authHeader.replace("Bearer ", "");

    if (WEBHOOK_SECRET && providedSecret !== WEBHOOK_SECRET) {
      console.error("Invalid webhook secret provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get the webhook body
    const body = await request.json();

    // 3. Determine the provider and extract data
    const providerType = determineProvider(request.headers, body);
    const bounceData = extractBounceData(providerType, body);

    if (!bounceData) {
      return NextResponse.json(
        { error: "Invalid bounce data" },
        { status: 400 }
      );
    }

    // 4. Process the bounce data
    const {
      email,
      bounceType,
      reason,
      messageId,
      diagnosticCode,
      bounceCategory,
    } = bounceData;

    console.log(`Processing ${bounceType} bounce for ${email}: ${reason}`);

    // 5. Handle based on bounce type
    if (bounceType === "HARD") {
      await handleHardBounce(email, reason, diagnosticCode);
    } else if (bounceType === "SOFT") {
      await handleSoftBounce(email, reason, diagnosticCode);
    } else {
      // Generic logging for unknown bounce types
      await logBounce({
        email,
        messageId,
        bounceType: "UNDETERMINED",
        reason,
        diagnosticCode,
        bounceCategory,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing bounce webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Determine the email provider from headers and body
 */
function determineProvider(headers: Headers, body: any): string {
  // Check for provider-specific headers or body structures
  const userAgent = headers.get("user-agent") || "";

  if (userAgent.includes("mailgun")) {
    return "mailgun";
  }

  if (userAgent.includes("SendGrid")) {
    return "sendgrid";
  }

  if (userAgent.includes("Postmark")) {
    return "postmark";
  }

  // Check body structure for specific providers
  if (body.event && body.event === "bounce" && body.recipient) {
    return "mailgun";
  }

  if (
    body.event &&
    (body.event === "bounce" || body.event === "dropped") &&
    body.email
  ) {
    return "sendgrid";
  }

  if (body.Type && body.Type === "Bounce" && body.Email) {
    return "postmark";
  }

  if (
    body.event &&
    (body.event === "bounce" || body.event === "blocked") &&
    body.email
  ) {
    return "mailjet";
  }

  // Default to generic
  return "generic";
}

/**
 * Extract standardized bounce data from provider-specific formats
 */
function extractBounceData(
  provider: string,
  body: any
): {
  email: string;
  bounceType: "HARD" | "SOFT" | "UNDETERMINED";
  reason: string;
  messageId?: string;
  diagnosticCode?: string;
  bounceCategory?: string;
} | null {
  try {
    switch (provider) {
      case "mailgun":
        return {
          email: body.recipient || body["event-data"]?.recipient || "",
          bounceType: determineBounceType(
            body.severity || body["event-data"]?.severity
          ),
          reason: body.reason || body["event-data"]?.reason || "Unknown reason",
          messageId: body["message-id"] || body["event-data"]?.["message-id"],
          diagnosticCode:
            body.diagnosticCode ||
            body["event-data"]?.["delivery-status"]?.message,
          bounceCategory:
            body.code || body["event-data"]?.["delivery-status"]?.code,
        };

      case "sendgrid":
        return {
          email: body.email || "",
          bounceType: body.event === "bounce" ? "HARD" : "SOFT",
          reason: body.reason || body.response || "Unknown reason",
          messageId: body.sg_message_id,
          diagnosticCode: body.status || body.response,
          bounceCategory: body.type || body.event,
        };

      case "postmark":
        return {
          email: body.Email || body.Recipient || "",
          bounceType: body.Type === "HardBounce" ? "HARD" : "SOFT",
          reason: body.Description || "Unknown reason",
          messageId: body.MessageID,
          diagnosticCode: body.Details,
          bounceCategory: body.Type,
        };

      case "mailjet":
        return {
          email: body.email || "",
          bounceType: body.hard_bounce ? "HARD" : "SOFT",
          reason: body.error_related_to || body.error || "Unknown reason",
          messageId: body.message_id,
          diagnosticCode: body.error,
          bounceCategory: body.event,
        };

      // Generic format - expects email, type, and reason at minimum
      case "generic":
        if (!body.email) return null;

        return {
          email: body.email,
          bounceType: determineBounceType(body.type || body.bounceType),
          reason: body.reason || body.description || "Unknown reason",
          messageId: body.messageId || body.message_id,
          diagnosticCode: body.diagnosticCode || body.diagnostic_code,
          bounceCategory: body.category || body.bounceCategory,
        };

      default:
        return null;
    }
  } catch (error) {
    console.error(
      `Error extracting bounce data for provider ${provider}:`,
      error
    );
    return null;
  }
}

/**
 * Determine bounce type based on provider-specific terminology
 */
function determineBounceType(type?: string): "HARD" | "SOFT" | "UNDETERMINED" {
  if (!type) return "UNDETERMINED";

  const lowerType = type.toLowerCase();

  if (
    lowerType === "permanent" ||
    lowerType === "hard" ||
    lowerType === "hardbounce" ||
    lowerType === "5.0.0"
  ) {
    return "HARD";
  }

  if (
    lowerType === "temporary" ||
    lowerType === "transient" ||
    lowerType === "soft" ||
    lowerType === "softbounce" ||
    lowerType === "4.0.0"
  ) {
    return "SOFT";
  }

  return "UNDETERMINED";
}
