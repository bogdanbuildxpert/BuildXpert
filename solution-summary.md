# Email Timeout Resolution Summary

## The Issue

Your production server was experiencing timeouts when trying to send emails via AWS SES SMTP. The error logs showed:

```
Error sending password reset email (attempt 2): Error: Connection timeout
code: 'ETIMEDOUT',
command: 'CONN'
```

## The Solution

We've implemented a multi-layered approach to fix the email sending issues:

### 1. Increased SMTP Timeouts

We've doubled the timeouts in the SMTP configuration in `lib/email.ts`:

```typescript
{
  connectionTimeout: 60000, // 60 seconds (increased from 30)
  greetingTimeout: 60000, // 60 seconds (increased from 30)
  socketTimeout: 90000, // 90 seconds (increased from 45)
}
```

### 2. Implemented AWS SES API as Alternative

Created two new modules to send emails using AWS SES API instead of SMTP:

- `lib/ses-email.ts` - Uses AWS SDK v3
- `lib/ses-email-v2.ts` - Uses AWS SDK v2 (often more reliable with special characters in credentials)

### 3. Improved Email Sending with Fallback Strategy

Updated email sending in authentication endpoints to try multiple methods in sequence:

1. First attempt: AWS SES API v2 (most reliable with special characters in credentials)
2. Second attempt: AWS SES API v3
3. Third attempt: SMTP (original method)

This ensures that even if one method fails, there are fallbacks.

## Server Configuration Instructions

For the server-side setup, please follow the instructions in `aws-ses-credentials-setup.md`. The key steps:

1. Create AWS credentials file on your server:

   ```bash
   mkdir -p /root/.aws
   cat > /root/.aws/credentials << EOF
   [default]
   aws_access_key_id = AKIAYTQS56JLNNTZCI3K
   aws_secret_access_key = BDalw9w5yqaU8z7+mWWHB4kBnFMIS/gCFOLG9sgqTfWn
   region = eu-west-1
   EOF
   chmod 600 /root/.aws/credentials
   ```

2. Verify that your server allows outbound connections to port 587:

   ```bash
   nc -zv email-smtp.eu-west-1.amazonaws.com 587
   ```

3. After deploying code changes, restart the application:
   ```bash
   pm2 restart buildxpert
   ```

## Files Changed

1. `lib/email.ts` - Increased SMTP connection timeouts
2. `lib/ses-email.ts` - Added AWS SES API v3 implementation
3. `lib/ses-email-v2.ts` - Added AWS SES API v2 implementation
4. `app/api/auth/forgot-password/route.ts` - Updated to use all three email methods
5. `app/api/auth/register/route.ts` - Updated to use all three email methods

## Testing

To test the email functionality:

1. On production server: `node test-ses-api-v2.js bogdan@buildxpert.ie`
2. Try the forgot password functionality on the live site

If you continue experiencing issues after these changes, additional steps might include:

- Switch to a different email provider (SendGrid, Mailgun, etc.)
- Configure a proxy or relay service for SMTP traffic
- Set up a dedicated email sending server
