const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer (SMTP / Gmail)
 * Falls back to terminal console logging if credentials are placeholder values.
 *
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.otp - The 6-digit OTP code for prominent logging
 */
const sendEmail = async ({ email, subject, text, html, otp }) => {
  // In test environment, skip external network SMTP calls
  if (process.env.NODE_ENV === 'test') {
    return { success: true, simulated: true, otp };
  }

  const isConfigured =
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes('your_email') &&
    !process.env.SMTP_PASS.includes('your_google_app_password');

  if (isConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const message = {
        from: process.env.SMTP_FROM || `"EcoCycle Srinagar" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(message);
      console.log(`[SMTP] Verification email dispatched to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[SMTP Error] Failed to send email via SMTP: ${err.message}`);
      // Fall through to console log
    }
  }

  // Development / Offline / Viva Demonstration Logger
  console.log(`\n=============================================================`);
  console.log(`[EMAIL DISPATCH SIMULATOR - DEV / VIVA DEMO]`);
  console.log(`Recipient: ${email}`);
  console.log(`Subject:   ${subject}`);
  if (otp) {
    console.log(`>>> 6-DIGIT VERIFICATION CODE: [ ${otp} ] <<<`);
  }
  console.log(`=============================================================\n`);

  return { success: true, simulated: true };
};

module.exports = sendEmail;
