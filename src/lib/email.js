// Email sending utility using Nodemailer (SMTP)
import nodemailer from 'nodemailer';

// Create a transporter using SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send OTP via email
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @param {string} recipientName - Recipient's full name
 * @returns {Promise<boolean>} True if sent successfully
 */
export async function sendOTPEmail(email, otp, recipientName = 'User') {
  try {
    // Validate email and OTP
    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Clergy Platform - Password Reset Code',
      html: generateOTPEmailHTML(otp, recipientName),
      text: generateOTPEmailText(otp, recipientName),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}:`, result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

/**
 * Generate HTML email template for OTP
 * @param {string} otp - OTP code
 * @param {string} name - Recipient name
 * @returns {string} HTML email content
 */
function generateOTPEmailHTML(otp, name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
        .content { text-align: center; margin: 30px 0; }
        .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace; margin: 15px 0; }
        .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
        .expiry { background-color: #fff3cd; color: #856404; padding: 12px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your Clergy Platform password. Use the code below to reset your password:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <div class="expiry">
            ⏱️ This code expires in <strong>10 minutes</strong>
          </div>
          
          <p style="color: #e74c3c; font-weight: bold;">Never share this code with anyone!</p>
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
        
        <div class="footer">
          <p>© 2026 Clergy Platform. All rights reserved.</p>
          <p>This is an automated message, please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email for OTP
 * @param {string} otp - OTP code
 * @param {string} name - Recipient name
 * @returns {string} Plain text email content
 */
function generateOTPEmailText(otp, name) {
  return `
PASSWORD RESET REQUEST

Hi ${name},

We received a request to reset your Clergy Platform password. Use the code below:

${otp}

This code expires in 10 minutes.

⚠️ Never share this code with anyone!

If you didn't request this, please ignore this email.

© 2026 Clergy Platform
  `;
}

/**
 * Send password reset confirmation email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise<boolean>} True if sent successfully
 */
export async function sendPasswordResetConfirmationEmail(email, name = 'User') {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Clergy Platform - Password Reset Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #27ae60; margin: 0; font-size: 28px; }
            .success { background-color: #d4edda; color: #155724; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Password Reset Successful</h1>
            </div>
            <div class="success">
              <p>Hi ${name},</p>
              <p>Your password has been successfully reset. You can now log in with your new password.</p>
            </div>
            <p>If you didn't make this change, please contact support immediately.</p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}
