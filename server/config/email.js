// config/email.js
require('dotenv').config();

// Frontend URL configuration
const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  return process.env.NODE_ENV === 'production' 
    ? 'https://64.225.3.4:3000'  // Frontend runs on port 3000
    : 'http://localhost:3000';
};

module.exports = {
  // The email address must be verified in SendGrid 
  senderEmail: process.env.SENDGRID_SENDER_EMAIL || 'your.verified.email@example.com',
  
  // Frontend URL for email links
  frontendUrl: getFrontendUrl(),
  
  // Email templates
  templates: {
    passwordReset: {
      subject: 'Macros - Reset Your Password',
      generateHtml: (resetUrl) => `
        <h1>Reset Your Password</h1>
        <p>You requested to reset your password for your Macros account.</p>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      generateText: (resetUrl) => 
        `Click the link below to reset your password. This link is valid for 1 hour.\n${resetUrl}`
    },

    emailVerify: {
      subject: 'Macros - Verify Your Email',
      generateHtml: (verifyUrl) => `
        <h1>Verify Your Email</h1>
        <p>Before you can start using Macros, we need you to verify this email address.</p>
        <p>Click the button below to verify your email. This link is valid for 1 hour.</p>
        <a href="${verifyUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
          Verify Email
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      generateText: (verifyUrl) => 
        `Click the link below to verify your email. This link is valid for 1 hour.\n${verifyUrl}`
    }
  }
}; 