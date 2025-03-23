# Using AWS SES with DigitalOcean Deployment

This guide outlines how to set up and use AWS SES for email sending from a DigitalOcean droplet.

## The Problem

DigitalOcean (and many cloud providers) blocks outbound SMTP traffic on port 587 by default to prevent spam. This causes timeouts when attempting to use SMTP directly.

## Solution Options

### Option 1: Use AWS SES Alternative SMTP Ports

AWS SES offers alternative ports that may work with DigitalOcean:

- Port 2587 (instead of 587)
- Port 2465 (instead of 465)

Update your `.env` file:

```
EMAIL_SERVER_PORT=2587
```

### Option 2: Use HTTP API Instead of SMTP

AWS SES provides both SMTP and API access. DigitalOcean will not block API calls.

Update your `.env` file:

```
USE_SES_API=true
```

### Option 3: Request Port Unblocking

You can request DigitalOcean to unblock SMTP ports for your droplet:

1. Contact DigitalOcean support
2. Provide your droplet ID and explain your legitimate email needs
3. They may unblock port 587 for your specific droplet

## Implementation Details

### Current Implementation

We've implemented a cascading fallback approach:

1. **SMTP (Primary)**: Tries to send via SMTP with increased timeouts and using alternative ports
2. **SES API (Fallback)**: Falls back to AWS SES API if SMTP fails

### AWS Credentials Format

When using AWS credentials, be aware of special characters in your Secret Access Key that might cause issues:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-1
```

Make sure to:

- Remove any trailing whitespace in your credentials
- Properly escape special characters in environment variables

## Testing AWS SES on DigitalOcean

1. SSH into your DigitalOcean droplet
2. Test SMTP connectivity:

   ```
   nc -zv email-smtp.eu-west-1.amazonaws.com 2587
   ```

3. Test AWS SES API:
   ```
   aws ses get-send-quota
   ```

## Troubleshooting

### SMTP Timeouts

- Check if your droplet can reach AWS SES SMTP servers on port 2587
- Try using the SES API instead

### SignatureDoesNotMatch Errors

- Check for trailing whitespace in your AWS credentials
- Ensure your system time is synchronized (use NTP)
- Verify you have the correct permissions to use SES

### Email Not Received

- Check SES sending limits
- Verify email addresses are confirmed in SES
- Check spam/junk folders

## Production Deployment Recommendations

1. Store AWS credentials securely using environment variables
2. Use AWS SES API for more reliable email delivery from DigitalOcean
3. Implement robust error handling and logging
4. Set up CloudWatch alarms for email failures
