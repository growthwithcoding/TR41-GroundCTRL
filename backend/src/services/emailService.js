/**
 * Email Service
 * Handles email delivery for password resets and notifications
 * 
 * This is a stub implementation that logs emails to console/logger.
 * Replace with actual email provider integration (SendGrid, AWS SES, etc.)
 * when ready for production.
 */

const logger = require('../utils/logger');

/**
 * Email configuration from environment
 */
const EMAIL_CONFIG = {
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@groundctrl.io',
  fromName: process.env.EMAIL_FROM_NAME || 'GroundCTRL Mission Control',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  enabled: process.env.EMAIL_ENABLED === 'true'
};

/**
 * Send password reset email
 * 
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Raw reset token (will be included in URL)
 * @param {string} callSign - User's call sign for personalization
 * @returns {Promise<boolean>} True if email was sent (or would be sent)
 */
async function sendPasswordResetEmail(email, resetToken, callSign) {
  const resetUrl = `${EMAIL_CONFIG.frontendUrl}/reset-password?token=${resetToken}`;
  
  const emailContent = {
    to: email,
    from: {
      address: EMAIL_CONFIG.fromAddress,
      name: EMAIL_CONFIG.fromName
    },
    subject: 'GroundCTRL - Password Reset Request',
    text: `
Mission Control Password Reset

Operator ${callSign || 'Pilot'},

We received a request to reset your password for your GroundCTRL account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Stay in orbit,
GroundCTRL Mission Control Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0e14; color: #e6e6e6; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1f2e; border-radius: 8px; padding: 30px; }
    .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #3b82f6; margin: 0; }
    .content { line-height: 1.6; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .button:hover { background: #2563eb; }
    .warning { background: #1e3a5f; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛰️ GroundCTRL</h1>
      <p>Mission Control Password Reset</p>
    </div>
    <div class="content">
      <p>Operator <strong>${callSign || 'Pilot'}</strong>,</p>
      <p>We received a request to reset your password for your GroundCTRL account.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      <div class="warning">
        ⏱️ This link will expire in <strong>15 minutes</strong>.
      </div>
      <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>Stay in orbit,<br>GroundCTRL Mission Control Team</p>
      <p>If the button doesn't work, copy and paste this URL:<br>${resetUrl}</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };
  
  if (EMAIL_CONFIG.enabled) {
    // TODO: Integrate with actual email provider
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send(emailContent);
    
    logger.info('Password reset email would be sent', { 
      to: email, 
      callSign,
      provider: 'NOT_CONFIGURED'
    });
  } else {
    // Development mode - log email content
    logger.info('Password reset email (EMAIL_ENABLED=false)', {
      to: email,
      callSign,
      resetUrl,
      subject: emailContent.subject
    });
    
    // In development, log the reset URL for easy testing
    logger.debug('DEV MODE - Reset URL:', { resetUrl });
  }
  
  return true;
}

/**
 * Send password changed confirmation email
 * 
 * @param {string} email - Recipient email address
 * @param {string} callSign - User's call sign for personalization
 * @returns {Promise<boolean>} True if email was sent
 */
async function sendPasswordChangedEmail(email, callSign) {
  const emailContent = {
    to: email,
    from: {
      address: EMAIL_CONFIG.fromAddress,
      name: EMAIL_CONFIG.fromName
    },
    subject: 'GroundCTRL - Password Changed Successfully',
    text: `
GroundCTRL Security Alert

Operator ${callSign || 'Pilot'},

Your password was successfully changed.

If you made this change, no further action is needed.

If you did NOT make this change, please contact Mission Control immediately and reset your password.

Stay secure,
GroundCTRL Mission Control Team
    `.trim()
  };
  
  if (EMAIL_CONFIG.enabled) {
    // TODO: Integrate with actual email provider
    logger.info('Password changed email would be sent', { to: email, callSign });
  } else {
    logger.info('Password changed email (EMAIL_ENABLED=false)', {
      to: email,
      callSign,
      subject: emailContent.subject
    });
  }
  
  return true;
}

/**
 * Check if email service is configured
 * @returns {boolean} True if email sending is enabled
 */
function isEmailEnabled() {
  return EMAIL_CONFIG.enabled;
}

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  isEmailEnabled,
  EMAIL_CONFIG
};