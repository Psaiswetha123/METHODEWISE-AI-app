/**
 * MethodWise AI - Email & OTP Dispatch Service
 * File: email-service.js
 * 
 * Handles sending real OTP emails to recipient email addresses (Gmail, Work Email, etc.)
 * using Nodemailer with Gmail SMTP and fallback SMTP transport options.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class OtpEmailService {
  constructor() {
    this.configFile = path.join(__dirname, 'database', 'email-config.json');
    this.config = this.loadConfig();
    this.transporter = null;
    this.initTransporter();
  }

  loadConfig() {
    let defaultConfig = {
      service: 'gmail',
      user: process.env.GMAIL_USER || 'saiswethanaidu.56@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || '', // Gmail App Password (16 chars)
      from: '"MethodWise AI" <saiswethanaidu.56@gmail.com>'
    };

    try {
      if (fs.existsSync(this.configFile)) {
        const savedConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        defaultConfig = { ...defaultConfig, ...savedConfig };
      } else {
        const dbFolder = path.join(__dirname, 'database');
        if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });
        fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[EMAIL SERVICE] Warning reading email-config.json:', e.message);
    }

    return defaultConfig;
  }

  initTransporter() {
    if (this.config.user && this.config.pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.config.user,
          pass: this.config.pass
        }
      });
      console.log(`[EMAIL SERVICE] Initialized Gmail SMTP Transporter for ${this.config.user}`);
    } else {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        }
      });
    }
  }

  /**
   * Send 6-digit OTP code to recipient email address
   * @param {string} recipientEmail - Email address provided by user
   * @param {string} otpCode - 6-digit OTP code
   */
  async sendOtpEmail(recipientEmail, otpCode) {
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #00f2fe;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #00f2fe, #3b82f6); border-radius: 12px; line-height: 48px; color: #040914; font-weight: bold; font-size: 24px;">MW</div>
          <h2 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 22px;">MethodWise AI</h2>
          <p style="color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Password Reset Request</p>
        </div>

        <div style="background: rgba(30, 41, 59, 0.7); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="color: #cbd5e1; font-size: 15px; margin-top: 0;">You requested to reset your password for recipient email:</p>
          <p style="color: #00f2fe; font-weight: 600; font-size: 16px; margin: 4px 0 16px 0;">${recipientEmail}</p>

          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 8px;">Your 6-digit One-Time Verification Code (OTP) is:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #00f2fe; background: #020617; border: 1.5px dashed #00f2fe; padding: 14px 24px; border-radius: 8px; display: inline-block; margin: 8px 0;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 12px; margin-bottom: 0;">⏱️ This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          If you did not request a password reset, please ignore this email.
        </p>
      </div>
    `;

    const mailOptions = {
      from: this.config.from || `"MethodWise AI" <${this.config.user}>`,
      to: recipientEmail,
      subject: `🔑 ${otpCode} is your MethodWise AI Password Reset Code`,
      text: `Your MethodWise AI password reset verification code is: ${otpCode}. It expires in 10 minutes.`,
      html: htmlTemplate
    };

    try {
      if (this.config.pass) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log(`[EMAIL SERVICE] OTP Email successfully sent to ${recipientEmail} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, recipient: recipientEmail };
      } else {
        console.log(`[EMAIL SERVICE] Attempting dispatch to ${recipientEmail}...`);
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
        const info = await testTransporter.sendMail(mailOptions);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[EMAIL SERVICE] Ethereal Test Email sent to ${recipientEmail}! Preview URL: ${previewUrl}`);
        return { success: true, previewUrl, recipient: recipientEmail, isTestAccount: true };
      }
    } catch (error) {
      console.error(`[EMAIL SERVICE] Error sending email to ${recipientEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OtpEmailService();
