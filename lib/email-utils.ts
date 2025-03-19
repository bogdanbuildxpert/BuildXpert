import prisma from "./db";
import nodemailer from "nodemailer";

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Fetch an email template by name
 */
export async function getEmailTemplate(templateName: string) {
  return await prisma.emailTemplate.findUnique({
    where: {
      name: templateName,
    },
  });
}

/**
 * Replace template variables with actual values
 */
export function parseTemplate(
  template: string,
  variables: Record<string, string>
) {
  let parsedTemplate = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    parsedTemplate = parsedTemplate.replace(regex, value);
  }

  return parsedTemplate;
}

/**
 * Send an email using a template
 */
export async function sendTemplatedEmail({
  to,
  templateName,
  variables,
  attachments = [],
}: {
  to: string;
  templateName: string;
  variables: Record<string, string>;
  attachments?: Array<{ filename: string; content: Buffer }>;
}) {
  try {
    // Get the template
    const template = await getEmailTemplate(templateName);

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Parse subject and content
    const subject = parseTemplate(template.subject, variables);
    const html = parseTemplate(template.content, variables);

    // Send the email
    const info = await transporter.sendMail({
      from: `"BuildXpert" <${
        process.env.EMAIL_FROM || "noreply@buildxpert.com"
      }>`,
      to,
      subject,
      html,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      })),
    });

    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      `Failed to send email with template '${templateName}':`,
      error
    );
    return { success: false, error };
  }
}

/**
 * Send a job status update email
 */
export async function sendJobStatusUpdateEmail({
  to,
  name,
  jobTitle,
  jobId,
  newStatus,
}: {
  to: string;
  name: string;
  jobTitle: string;
  jobId: string;
  newStatus: string;
}) {
  return sendTemplatedEmail({
    to,
    templateName: "job_status_update",
    variables: {
      name,
      jobTitle,
      newStatus: newStatus.replace("_", " ").toLowerCase(),
      jobLink: `${
        process.env.APP_URL || "http://localhost:3000"
      }/jobs/${jobId}`,
    },
  });
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  return sendTemplatedEmail({
    to,
    templateName: "welcome_email",
    variables: {
      name,
      dashboardLink: `${
        process.env.APP_URL || "http://localhost:3000"
      }/dashboard`,
    },
  });
}

/**
 * Send a job posting confirmation email
 */
export async function sendJobPostingConfirmationEmail({
  to,
  name,
  jobTitle,
  jobLocation,
  jobId,
}: {
  to: string;
  name: string;
  jobTitle: string;
  jobLocation: string;
  jobId: string;
}) {
  return sendTemplatedEmail({
    to,
    templateName: "job_posted_confirmation",
    variables: {
      name,
      jobTitle,
      location: jobLocation,
      postedDate: new Date().toLocaleDateString(),
      dashboardLink: `${
        process.env.APP_URL || "http://localhost:3000"
      }/jobs/${jobId}`,
    },
  });
}
