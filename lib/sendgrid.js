const sgMail = require("@sendgrid/mail");

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version of email
 * @param {string} options.html - HTML version of email
 * @param {string} [options.from] - Sender email (defaults to EMAIL_FROM env var)
 * @param {string} [options.fromName] - Sender name (defaults to EMAIL_FROM_NAME env var)
 * @returns {Promise} - SendGrid API response
 */
async function sendEmail({
  to,
  subject,
  text,
  html,
  from = process.env.EMAIL_FROM,
  fromName = process.env.EMAIL_FROM_NAME,
}) {
  const msg = {
    to,
    from: {
      email: from,
      name: fromName,
    },
    subject,
    text,
    html,
  };

  try {
    const response = await sgMail.send(msg);
    console.log("Email sent successfully via SendGrid API");
    return response;
  } catch (error) {
    console.error("SendGrid API error:", error);
    if (error.response) {
      console.error("Error body:", error.response.body);
    }
    throw error;
  }
}

/**
 * Send a test email
 * @param {string} to - Test recipient email
 * @returns {Promise} - SendGrid API response
 */
async function sendTestEmail(to) {
  return sendEmail({
    to,
    subject: "Test Email from BuildXpert via SendGrid API",
    text: "This is a test email sent via the SendGrid API.",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
        <h1 style="color: #333;">Test Email from BuildXpert</h1>
        <p>This is a test email sent from the BuildXpert application using SendGrid API.</p>
        <p>If you're receiving this, your email configuration is working correctly!</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>BuildXpert - Professional Painting Services</p>
        </div>
      </div>
    `,
  });
}

module.exports = {
  sendEmail,
  sendTestEmail,
};
