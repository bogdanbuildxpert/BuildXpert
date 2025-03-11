// Script to seed initial email templates
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding email templates...");

  // Contact confirmation email template
  await prisma.emailTemplate.upsert({
    where: { name: "contact_confirmation" },
    update: {
      subject: "We received your message - BuildXpert",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Thank You for Contacting Us!</h2>
        <p>Hello {{name}},</p>
        <p>We have received your message regarding "{{subject}}". Thank you for reaching out to BuildXpert.</p>
        <p>Our team will review your inquiry and get back to you as soon as possible, typically within 1-2 business days.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Your request has been logged with the following details:</p>
          <p style="margin: 10px 0 0 0;">Subject: {{subject}}</p>
          <p style="margin: 5px 0 0 0;">Date: {{date}}</p>
        </div>
        <p>If you have any additional information to add to your inquiry, please reply to this email.</p>
        <p>Best regards,</p>
        <p><strong>The BuildXpert Team</strong></p>
      `,
    },
    create: {
      name: "contact_confirmation",
      subject: "We received your message - BuildXpert",
      description: "Email sent to customers after they submit a contact form",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Thank You for Contacting Us!</h2>
        <p>Hello {{name}},</p>
        <p>We have received your message regarding "{{subject}}". Thank you for reaching out to BuildXpert.</p>
        <p>Our team will review your inquiry and get back to you as soon as possible, typically within 1-2 business days.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Your request has been logged with the following details:</p>
          <p style="margin: 10px 0 0 0;">Subject: {{subject}}</p>
          <p style="margin: 5px 0 0 0;">Date: {{date}}</p>
        </div>
        <p>If you have any additional information to add to your inquiry, please reply to this email.</p>
        <p>Best regards,</p>
        <p><strong>The BuildXpert Team</strong></p>
      `,
    },
  });

  // Contact notification email template
  await prisma.emailTemplate.upsert({
    where: { name: "contact_notification" },
    update: {
      subject: "New Contact Form Submission: {{subject}}",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h2>
        <p>A new contact form has been submitted on the BuildXpert website.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> {{name}}</p>
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Phone:</strong> {{phone}}</p>
          <p><strong>Preferred Contact Method:</strong> {{preferredContact}}</p>
          <p><strong>Subject:</strong> {{subject}}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 10px; border-radius: 3px;">
            {{message}}
          </div>
          <p><strong>Date:</strong> {{date}}</p>
        </div>
        
        <p>You can view and manage all contact submissions in the <a href="{{adminUrl}}" style="color: #0070f3;">admin dashboard</a>.</p>
      `,
    },
    create: {
      name: "contact_notification",
      subject: "New Contact Form Submission: {{subject}}",
      description: "Email sent to admins when a new contact form is submitted",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h2>
        <p>A new contact form has been submitted on the BuildXpert website.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> {{name}}</p>
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Phone:</strong> {{phone}}</p>
          <p><strong>Preferred Contact Method:</strong> {{preferredContact}}</p>
          <p><strong>Subject:</strong> {{subject}}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 10px; border-radius: 3px;">
            {{message}}
          </div>
          <p><strong>Date:</strong> {{date}}</p>
        </div>
        
        <p>You can view and manage all contact submissions in the <a href="{{adminUrl}}" style="color: #0070f3;">admin dashboard</a>.</p>
      `,
    },
  });

  // Email verification template
  await prisma.emailTemplate.upsert({
    where: { name: "email_verification" },
    update: {
      subject: "Verify your BuildXpert account",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to BuildXpert!</h2>
        <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationLink}}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
          <br>
          <a href="{{verificationLink}}" style="color: #0070f3; word-break: break-all;">{{verificationLink}}</a>
        </p>
      `,
    },
    create: {
      name: "email_verification",
      subject: "Verify your BuildXpert account",
      description: "Email sent to users to verify their email address",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to BuildXpert!</h2>
        <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationLink}}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
          <br>
          <a href="{{verificationLink}}" style="color: #0070f3; word-break: break-all;">{{verificationLink}}</a>
        </p>
      `,
    },
  });

  // Password reset template
  await prisma.emailTemplate.upsert({
    where: { name: "password_reset" },
    update: {
      subject: "Reset Your BuildXpert Password",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
        <p>We received a request to reset your password for your BuildXpert account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetLink}}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour for security reasons.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
          <br>
          <a href="{{resetLink}}" style="color: #0070f3; word-break: break-all;">{{resetLink}}</a>
        </p>
      `,
    },
    create: {
      name: "password_reset",
      subject: "Reset Your BuildXpert Password",
      description: "Email sent to users to reset their password",
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
        <p>We received a request to reset your password for your BuildXpert account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetLink}}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour for security reasons.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
          <br>
          <a href="{{resetLink}}" style="color: #0070f3; word-break: break-all;">{{resetLink}}</a>
        </p>
      `,
    },
  });

  console.log("Email templates seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding email templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
