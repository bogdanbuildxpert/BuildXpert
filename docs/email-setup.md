# Email Configuration Guide for BuildXpert

This guide explains how to set up and use the email functionality in the BuildXpert application.

## Email Service Options

BuildXpert is configured to use either SendGrid or a fallback SMTP service for sending emails.

### SendGrid (Recommended)

SendGrid provides both API and SMTP options for sending emails. The application is set up to use the API by default and fall back to SMTP if needed.

#### Setup Steps:

1. **Create a SendGrid account**:

   - Sign up at [sendgrid.com](https://sendgrid.com)
   - They offer a free tier with 100 emails/day

2. **Create an API key**:

   - Navigate to Settings → API Keys → Create API Key
   - Name it (e.g., "BuildXpert API")
   - Select "Full Access" or customize permissions
   - Copy the generated API key

3. **Verify your sending domain**:

   - Go to Settings → Sender Authentication → Domains
   - Click "Authenticate a Domain"
   - Follow the steps to add the required DNS records to your domain

4. **Configure environment variables**:
   Add to your `.env` file:

   ```
   # SendGrid Configuration
   SENDGRID_API_KEY=your_api_key_here
   EMAIL_FROM=office@buildxpert.ie
   EMAIL_FROM_NAME=BuildXpert

   # SendGrid SMTP (fallback)
   EMAIL_SERVER=smtp.sendgrid.net
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=apikey
   EMAIL_SERVER_PASSWORD=your_api_key_here
   EMAIL_SERVER_SECURE=false
   ```

## Testing Your Configuration

1. **Run the API test script**:

   ```
   node scripts/test-sendgrid-api.js
   ```

2. **Run the SMTP test script**:

   ```
   node scripts/test-email.js
   ```

3. **Run both tests at once**:
   ```
   node scripts/test-all-email.js
   ```

## How the Email System Works

1. When sending an email, the system tries the SendGrid API first
2. If the API call fails or SendGrid is not configured, it falls back to SMTP
3. All email sending functions are in `lib/email.ts`

## Using Email Functions in Your Code

```typescript
import { sendEmail } from "@/lib/email";

// Example: Sending a custom email
await sendEmail({
  to: "recipient@example.com",
  subject: "Your Subject",
  text: "Plain text version",
  html: "<p>HTML version</p>",
  fromName: "Optional custom name",
  replyTo: "optional-reply-address@example.com",
});
```

## Troubleshooting

1. **Emails not sending**:

   - Check that your SendGrid account is active
   - Verify your domain is authenticated in SendGrid
   - Check your API key permissions
   - Try the fallback SMTP method

2. **Blocked by email providers**:

   - Ensure your domain has proper SPF, DKIM records
   - Check that your sending domain is verified in SendGrid

3. **Rate limits exceeded**:
   - Free tier has limitations (100 emails/day)
   - Upgrade your SendGrid plan if needed

## Server Deployment

When deploying to your DigitalOcean server:

1. Add the same environment variables to your production `.env`
2. SendGrid will bypass DigitalOcean's SMTP blocking
3. No need to configure Postfix/local mail server when using SendGrid

For detailed logs of email activities, check your SendGrid dashboard.
