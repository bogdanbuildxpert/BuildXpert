import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Verify your BuildXpert account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to BuildXpert!</h2>
        <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can also copy and paste this link into your browser:
          <br>
          ${verificationLink}
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendContactConfirmationEmail = async (
  to: string,
  name: string,
  subject: string
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "We received your message - BuildXpert",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Contacting Us!</h2>
        <p>Hello ${name},</p>
        <p>We have received your message regarding "${subject}". Thank you for reaching out to BuildXpert.</p>
        <p>Our team will review your inquiry and get back to you as soon as possible, typically within 1-2 business days.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Your request has been logged with the following details:</p>
          <p style="margin: 10px 0 0 0;">Subject: ${subject}</p>
          <p style="margin: 5px 0 0 0;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <p>If you have any additional information to add to your inquiry, please reply to this email.</p>
        <p>Best regards,</p>
        <p><strong>The BuildXpert Team</strong></p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendContactNotificationEmail = async (contactData: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) => {
  const { name, email, phone, subject, message } = contactData;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to admin email
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <p>A new contact form has been submitted on the BuildXpert website.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 10px; border-radius: 3px;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>You can view and manage all contact submissions in the <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/admin/contacts">admin dashboard</a>.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
