# AWS SES Integration for BuildXpert

This document outlines the AWS SES integration for email sending in BuildXpert.

## Implementation Summary

We use a cascading approach to send emails:

1. **Primary Method: SMTP** - More compatible with most environments but may be blocked by cloud providers
2. **Fallback Method: AWS SES API** - Used when SMTP is blocked or fails with timeout errors

## Environment Variables

The following environment variables are used:

```
# SMTP/SES Authentication (same credentials for both)
EMAIL_SERVER_USER=your_aws_access_key_id
EMAIL_SERVER_PASSWORD=your_aws_secret_access_key

# SMTP Settings
EMAIL_SERVER_HOST=email-smtp.eu-west-1.amazonaws.com
EMAIL_SERVER_PORT=2587  # Use alternative port for DigitalOcean
EMAIL_SERVER_SECURE=false
EMAIL_FROM=noreply@buildxpert.ie
EMAIL_FROM_NAME=BuildXpert

# AWS Region
AWS_REGION=eu-west-1
```

## DigitalOcean Compatibility

DigitalOcean and many cloud providers block outbound SMTP traffic on port 587 by default. We've implemented several solutions:

1. **Alternative SMTP Ports**:

   - Port 2587 instead of 587
   - Port 2465 instead of 465

2. **Increased Timeouts**:

   - Connection Timeout: 60 seconds
   - Greeting Timeout: 60 seconds
   - Socket Timeout: 90 seconds

3. **SES API Fallback**:
   - Automatically falls back to API if SMTP times out
   - Doesn't require SMTP ports to be open

## Important Files

- `lib/email.ts` - Primary email sending implementation using SMTP
- `lib/ses-email-v2.ts` - AWS SES API implementation (SDK v2)
- `app/api/auth/register/route.ts` - Email verification implementation
- `app/api/auth/forgot-password/route.ts` - Password reset implementation

## Troubleshooting

### SMTP Connection Issues

If you encounter SMTP connection issues on DigitalOcean:

1. Check if the alternative port is working:

   ```bash
   nc -zv email-smtp.eu-west-1.amazonaws.com 2587
   ```

2. If still not working, request port unblocking from DigitalOcean support or rely on the SES API fallback.

### AWS Credentials Issues

For AWS SES API `SignatureDoesNotMatch` errors:

1. Check for special characters in your AWS secret key
2. Ensure no trailing whitespace in environment variables
3. Make sure your AWS credentials have SES permissions

## Maintenance

When updating the email functionality:

1. Always test SMTP to detect DigitalOcean blocking
2. Maintain the fallback mechanism to SES API
3. Handle timeouts gracefully to preserve user experience

## Further Documentation

For more details, see:

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [DigitalOcean Firewall Documentation](https://docs.digitalocean.com/products/networking/firewalls/)
