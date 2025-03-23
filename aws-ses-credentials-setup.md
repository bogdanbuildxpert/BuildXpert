# AWS SES Credentials Setup for Production Server

This document explains how to set up AWS credentials on your production server to solve the email timeouts.

## The Issue

Your server is experiencing SMTP timeouts when trying to send emails. This could be due to:

1. Network restrictions blocking outbound SMTP traffic (port 587)
2. Authentication issues with the AWS SES credentials
3. Special characters in your credentials that are not being properly encoded

## Solution 1: Configure AWS CLI

The most reliable method is to set up credentials using the AWS CLI:

1. SSH into your production server

2. Install AWS CLI if not already installed:

   ```bash
   apt-get update
   apt-get install -y awscli
   ```

3. Configure AWS CLI with your credentials:

   ```bash
   aws configure
   ```

   When prompted, enter:

   - AWS Access Key ID: `AKIAYTQS56JLNNTZCI3K`
   - AWS Secret Access Key: `BDalw9w5yqaU8z7+mWWHB4kBnFMIS/gCFOLG9sgqTfWn`
   - Default region name: `eu-west-1`
   - Default output format: `json`

4. Test the configuration:
   ```bash
   aws ses get-send-quota
   ```

This creates a proper AWS credentials file with correct escaping for special characters.

## Solution 2: Use Amazon SES API instead of SMTP

If port 587 is blocked, you can use the AWS SES API instead:

1. Copy the `lib/ses-email-v2.ts` file to your production server.

2. Update the `app/api/auth/forgot-password/route.ts` and `app/api/auth/register/route.ts` files to use the SES API v2 functions.

3. Deploy the changes and restart your application:
   ```bash
   pm2 restart buildxpert
   ```

## Solution 3: Use an Alternative Email Provider

If AWS SES continues to cause issues, consider using another email provider like:

- Sendgrid
- Mailgun
- Postmark

These services often provide more robust email delivery and may work better with your server configuration.

## Checking Firewall Rules

To verify if port 587 is blocked:

```bash
# Install netcat if not available
apt-get install -y netcat

# Test connection to AWS SES SMTP server
nc -zv email-smtp.eu-west-1.amazonaws.com 587

# If that fails, you can try connecting to a well-known port to confirm internet connectivity
nc -zv google.com 443
```

If the first command fails but the second succeeds, your server likely has a firewall rule blocking outbound SMTP connections.

## Quick Fix for Your Current Issue

1. Create a file on your server: `/root/.aws/credentials` with these contents:

   ```
   [default]
   aws_access_key_id = AKIAYTQS56JLNNTZCI3K
   aws_secret_access_key = BDalw9w5yqaU8z7+mWWHB4kBnFMIS/gCFOLG9sgqTfWn
   region = eu-west-1
   ```

2. Make sure the file has secure permissions:

   ```bash
   chmod 600 /root/.aws/credentials
   ```

3. Restart your application:
   ```bash
   pm2 restart buildxpert
   ```

This should allow your application to use the AWS credentials file directly, avoiding issues with special characters.
