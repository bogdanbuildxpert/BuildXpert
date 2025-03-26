# Setting Up Google SMTP for BuildXpert

This guide will help you configure BuildXpert to use Google SMTP for sending emails instead of AWS SES.

## Prerequisites

1. A Google account (Gmail)
2. App password for your Google account (if you have 2-factor authentication enabled)

## Creating a Google App Password

If you have 2-factor authentication enabled on your Google account (recommended), you'll need to generate an App Password:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Select **Security**
3. Under "Signing in to Google," select **2-Step Verification**
4. At the bottom of the page, select **App passwords**
5. Enter a name for the app password (e.g., "BuildXpert")
6. Click **Create**
7. Google will generate a 16-character password - **copy this password**

## Configuring Your .env File

Update your `.env` file with the following settings:

```
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-gmail-address@gmail.com"
EMAIL_SERVER_PASSWORD="your-16-character-app-password"
EMAIL_FROM="your-gmail-address@gmail.com"
EMAIL_FROM_NAME="BuildXpert Support"
EMAIL_DOMAIN="buildxpert.ie"
```

Replace:

- `your-gmail-address@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the app password you generated

## Email Sending Limits

Be aware that Gmail has sending limits:

- 500 emails per day for regular Gmail accounts
- 2,000 emails per day for Google Workspace accounts

If you need to send a higher volume of emails, consider:

1. Using a Google Workspace account
2. Exploring email service providers like SendGrid, Mailgun, or Postmark

## Troubleshooting

If emails are not being sent:

1. Check that you've entered the correct app password
2. Verify that "Less secure app access" is enabled (if not using an app password)
3. Check for any error messages in the application logs
4. Try sending a test email using the application

## Gmail Configuration for Production Use

For production environments, consider using a dedicated Google Workspace account rather than a personal Gmail account to:

- Have higher sending limits
- Keep business emails separate from personal emails
- Have access to Google Workspace support
