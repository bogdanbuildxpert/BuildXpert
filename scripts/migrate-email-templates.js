// Script to migrate email templates
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrateEmailTemplates() {
  try {
    console.log("Migrating email templates...");

    // Define default email templates
    const templates = [
      {
        name: "job_posted_confirmation",
        subject: "Your job posting has been submitted successfully",
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Job Posting Confirmation</h2>
          <p>Dear {{name}},</p>
          <p>Thank you for submitting your job posting "<strong>{{jobTitle}}</strong>". Your job has been successfully posted and is now visible on our platform.</p>
          <p>Here's a summary of your job posting:</p>
          <ul>
            <li><strong>Job Title:</strong> {{jobTitle}}</li>
            <li><strong>Location:</strong> {{location}}</li>
            <li><strong>Posted On:</strong> {{postedDate}}</li>
          </ul>
          <p>You can view and manage your job posting by visiting your dashboard.</p>
          <p><a href="{{dashboardLink}}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
          <p>If you have any questions or need to make changes to your posting, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The BuildXpert Team</p>
        </div>`,
        description: "Sent to users when they successfully post a new job",
      },
      {
        name: "job_application_received",
        subject: "New application for your job posting",
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">New Job Application</h2>
          <p>Dear {{name}},</p>
          <p>Great news! You've received a new application for your job posting "<strong>{{jobTitle}}</strong>".</p>
          <p>Application details:</p>
          <ul>
            <li><strong>Applicant:</strong> {{applicantName}}</li>
            <li><strong>Applied On:</strong> {{applicationDate}}</li>
          </ul>
          <p>You can view this application and contact the applicant by visiting your dashboard.</p>
          <p><a href="{{dashboardLink}}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Application</a></p>
          <p>Best regards,<br>The BuildXpert Team</p>
        </div>`,
        description: "Sent to job posters when someone applies to their job",
      },
      {
        name: "welcome_email",
        subject: "Welcome to BuildXpert",
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Welcome to BuildXpert!</h2>
          <p>Dear {{name}},</p>
          <p>Thank you for joining BuildXpert. We're excited to have you as part of our community of construction professionals and clients.</p>
          <p>With your BuildXpert account, you can:</p>
          <ul>
            <li>Post job openings and find qualified professionals</li>
            <li>Browse available jobs in your area</li>
            <li>Manage your projects and communicate with clients/contractors</li>
            <li>Track progress on ongoing work</li>
          </ul>
          <p>To get started, visit your dashboard:</p>
          <p><a href="{{dashboardLink}}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
          <p>If you have any questions or need assistance, our support team is here to help.</p>
          <p>Best regards,<br>The BuildXpert Team</p>
        </div>`,
        description: "Sent to new users when they create an account",
      },
      {
        name: "password_reset",
        subject: "Reset your BuildXpert password",
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Password Reset Request</h2>
          <p>Dear {{name}},</p>
          <p>We received a request to reset your BuildXpert password. Click the button below to set a new password:</p>
          <p><a href="{{resetLink}}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link is valid for 24 hours. If you didn't request a password reset, you can ignore this email.</p>
          <p>Best regards,<br>The BuildXpert Team</p>
        </div>`,
        description: "Sent when a user requests a password reset",
      },
      {
        name: "job_status_update",
        subject: "Update on your job: {{jobTitle}}",
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Job Status Update</h2>
          <p>Dear {{name}},</p>
          <p>We're writing to inform you that the status of your job "<strong>{{jobTitle}}</strong>" has been updated to <strong>{{newStatus}}</strong>.</p>
          <p>You can view the full details and any updates by visiting your dashboard:</p>
          <p><a href="{{jobLink}}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Job Details</a></p>
          <p>If you have any questions about this status change, please contact our support team.</p>
          <p>Best regards,<br>The BuildXpert Team</p>
        </div>`,
        description: "Sent when a job's status is updated",
      },
    ];

    console.log(`Preparing to migrate ${templates.length} email templates...`);

    // Create or update each template
    for (const template of templates) {
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: {
          name: template.name,
        },
      });

      if (existingTemplate) {
        // Update the existing template
        await prisma.emailTemplate.update({
          where: {
            id: existingTemplate.id,
          },
          data: {
            subject: template.subject,
            content: template.content,
            description: template.description,
            updatedAt: new Date(),
          },
        });
        console.log(`✅ Updated existing template: ${template.name}`);
      } else {
        // Create a new template
        await prisma.emailTemplate.create({
          data: template,
        });
        console.log(`✅ Created new template: ${template.name}`);
      }
    }

    console.log("Email template migration completed successfully!");
  } catch (error) {
    console.error("Error migrating email templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateEmailTemplates();
