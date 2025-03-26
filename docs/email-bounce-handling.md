# Email Bounce Handling System

This document explains how email bounce handling works in the BuildXpert application.

## Overview

Email bounce handling is essential for maintaining good email deliverability and understanding delivery problems. Our system:

1. Detects bounced emails through SMTP error handling
2. Categorizes bounces as hard or soft
3. Maintains a suppression list for hard bounces
4. Implements backoff strategies for soft bounces
5. Provides a webhook endpoint for external bounce notifications
6. Offers an admin interface for managing bounced emails

## Key Components

### 1. Database Model

We store bounce information in the `EmailBounce` table with the following key fields:

- `email` - The recipient's email address
- `bounceType` - HARD, SOFT, or UNDETERMINED
- `reason` - The reason for the bounce
- `status` - NEW, PROCESSED, IGNORED, or RESOLVED
- `timestamp` - When the bounce occurred
- `retryCount` - Number of times the email has bounced
- `retryAfter` - When to next attempt delivery (for soft bounces)

### 2. SMTP Error Handling

The system automatically detects bounces by:

- Analyzing SMTP error codes (e.g., 5xx for hard bounces, 4xx for soft bounces)
- Examining error messages for error descriptions
- Routing errors to appropriate handlers based on bounce type

### 3. Email Safety Checking

Before sending emails, we check if:

- The email format is valid
- The email is not on the suppression list (has a hard bounce)
- The email is not in a backoff period (has a recent soft bounce)

### 4. Webhook Support

For email providers that offer bounce webhooks, we provide an endpoint:

```
POST /api/webhook/email/bounce
```

This endpoint supports bounce notifications from:

- Mailgun
- SendGrid
- Postmark
- Mailjet
- Generic webhook format

### 5. Admin Interface

An admin interface at `/admin/bounces` allows you to:

- View all bounced emails
- See bounce reasons and types
- Remove emails from the suppression list
- Mark soft bounces as resolved

## Bounce Classification

### Hard Bounces (Permanent Failures)

Hard bounces indicate a permanent delivery issue and typically include:

- Invalid email address
- Domain doesn't exist
- Mailbox doesn't exist
- Blocked by recipient server

Actions: Emails with hard bounces are added to a suppression list to prevent future sending attempts.

### Soft Bounces (Temporary Failures)

Soft bounces indicate a temporary delivery issue and typically include:

- Mailbox full
- Server temporarily unavailable
- Message too large
- Rate limiting/throttling

Actions: Soft bounces use an exponential backoff strategy:

- 1st soft bounce: 4 hours wait
- 2nd soft bounce: 8 hours wait
- 3rd soft bounce: 16 hours wait
- 4th soft bounce: 32 hours wait
- 5th+ soft bounce: 48 hours wait or converted to hard bounce

## How to Use

### Sending Emails Safely

Use the `sendEmail()` function which automatically handles bounce checking:

```typescript
import { sendEmail } from "@/lib/email";

const result = await sendEmail({
  to: "recipient@example.com",
  subject: "Your Subject",
  html: "<p>Email content</p>",
});

if (result.success) {
  console.log(`Email sent: ${result.messageId}`);
} else {
  console.error(`Email not sent: ${result.error}`);
}
```

### Configuring Webhook Support

1. Set an `EMAIL_WEBHOOK_SECRET` in your `.env` file
2. Configure your email provider to send bounce webhooks to `/api/webhook/email/bounce`
3. Include your secret in the Authorization header: `Bearer your-secret-here`

## Manual Testing

To test the bounce handling system:

1. Send an email to a known invalid address (e.g., `nonexistent@domain.com`)
2. Check the admin interface for recorded bounces
3. Verify that subsequent send attempts to that address are blocked

## Maintenance

Regularly check the admin interface for:

1. Patterns of hard bounces (may indicate list quality issues)
2. Persistent soft bounces (may indicate delivery problems with specific domains)
3. Unexpected bounces from valid addresses (may indicate sender reputation issues)

You can manually remove addresses from the suppression list if you believe they should be valid.

## Customizing Behavior

Key areas for customization:

1. Backoff timing for soft bounces (`handleSoftBounce` function)
2. Number of soft bounces before conversion to hard bounce (currently 5)
3. SMTP error code categorization (`categorizeSMTPError` function)
4. Webhook provider support (add new providers to the `determineProvider` function)
