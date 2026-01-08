const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    try {
      // Create transporter based on environment
      if (process.env.EMAIL_SERVICE === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } else if (process.env.SMTP_HOST) {
        // Custom SMTP server
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
      } else {
        // Development mode - use ethereal email for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 Email Service: Using Ethereal test account');
        console.log('   Test emails: https://ethereal.email/messages');
      }

      // Verify connection
      await this.transporter.verify();
      this.initialized = true;
      console.log('✅ Email Service initialized successfully');
    } catch (error) {
      console.error('❌ Email Service initialization failed:', error.message);
      console.warn('⚠️  Email functionality will be disabled');
      this.initialized = false;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(user, verificationToken) {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping email');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const verificationUrl = `${process.env.WEB_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to In and Out Car Wash!</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name || 'there'},</p>
                <p>Thank you for registering with us! Please verify your email address to activate your account.</p>
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} In and Out Car Wash. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Verification email sent:', info.messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping email');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const resetUrl = `${process.env.WEB_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name || 'there'},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
                <div class="warning">
                  <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                </div>
                <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                <p>For security reasons, we recommend:</p>
                <ul>
                  <li>Use a strong, unique password</li>
                  <li>Don't share your password with anyone</li>
                  <li>Enable two-factor authentication</li>
                </ul>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} In and Out Car Wash. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Password reset email sent:', info.messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    if (!this.initialized) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: 'Welcome to In and Out Car Wash!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome Aboard!</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name},</p>
                <p>Welcome to In and Out Car Wash! We're thrilled to have you join our community.</p>

                <h2>What You Can Do:</h2>

                <div class="feature">
                  <strong>📅 Quick Booking</strong>
                  <p>Book your car wash in just 3 taps!</p>
                </div>

                <div class="feature">
                  <strong>💰 Loyalty Rewards</strong>
                  <p>Earn points with every wash and get free services!</p>
                </div>

                <div class="feature">
                  <strong>🎯 Track Your Service</strong>
                  <p>Monitor your car wash progress in real-time.</p>
                </div>

                <div class="feature">
                  <strong>💳 Digital Wallet</strong>
                  <p>Top up your wallet and enjoy cashback on every transaction!</p>
                </div>

                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/services" class="button">Book Your First Wash</a>
                </p>

                <p>Need help? Our support team is here for you 24/7.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} In and Out Car Wash. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send guest booking confirmation email
   */
  async sendGuestBookingConfirmation({ email, name, bookingNumber, confirmationCode, scheduledDate, vehicleInfo, serviceName, totalPrice }) {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping guest booking email');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: email,
        subject: `Guest Booking Confirmation - ${bookingNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .confirmation-code { background: #fff3cd; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; border: 2px dashed #ffc107; }
              .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 3px; }
              .button { display: inline-block; padding: 12px 30px; background: #43e97b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .important-note { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Guest Booking Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Thank you for booking with In and Out Car Wash! Your booking has been confirmed.</p>

                <div class="confirmation-code">
                  <p style="margin: 0; font-size: 14px; color: #666;">Your Confirmation Code:</p>
                  <div class="code">${confirmationCode}</div>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Save this code to track or cancel your booking</p>
                </div>

                <div class="booking-details">
                  <h2>Booking Details</h2>
                  <div class="detail-row">
                    <strong>Booking Number:</strong>
                    <span>${bookingNumber}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Date & Time:</strong>
                    <span>${new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  ${serviceName ? `
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${serviceName}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <strong>Vehicle:</strong>
                    <span>${vehicleInfo}</span>
                  </div>
                  ${totalPrice ? `
                  <div class="detail-row">
                    <strong>Total Amount:</strong>
                    <span style="color: #43e97b; font-weight: bold;">AED ${totalPrice}</span>
                  </div>
                  ` : ''}
                </div>

                <div class="important-note">
                  <strong>📌 Important:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Please arrive 5 minutes before your scheduled time</li>
                    <li>Keep your confirmation code ready: <strong>${confirmationCode}</strong></li>
                    <li>Our professional team will take great care of your vehicle</li>
                  </ul>
                </div>

                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/guest-booking/${confirmationCode}" class="button">Track Your Booking</a>
                </p>

                <p style="font-size: 14px; color: #666;">
                  Need to make changes or cancel? Visit our website and enter your confirmation code.
                </p>

                <p>Thank you for choosing In and Out Car Wash! We look forward to serving you.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} In and Out Car Wash. All rights reserved.</p>
                <p>For support, contact us at ${process.env.SUPPORT_EMAIL || 'support@carwash.com'}</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Guest booking confirmation email sent:', info.messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send guest booking confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(user, booking) {
    if (!this.initialized) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: `Booking Confirmation - ${booking.bookingNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .button { display: inline-block; padding: 12px 30px; background: #43e97b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Booking Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name},</p>
                <p>Your booking has been confirmed. We look forward to serving you!</p>

                <div class="booking-details">
                  <h2>Booking Details</h2>
                  <div class="detail-row">
                    <strong>Booking Number:</strong>
                    <span>${booking.bookingNumber}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Date:</strong>
                    <span>${new Date(booking.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Time:</strong>
                    <span>${booking.scheduledTime}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${booking.serviceName || 'Car Wash Service'}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Total:</strong>
                    <span>$${booking.totalPrice}</span>
                  </div>
                </div>

                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/bookings/${booking._id}" class="button">View Booking</a>
                </p>

                <p><strong>What to Expect:</strong></p>
                <ul>
                  <li>Please arrive 5 minutes before your scheduled time</li>
                  <li>Have your booking number ready</li>
                  <li>Our professional team will take care of your vehicle</li>
                </ul>

                <p>Need to make changes? <a href="${process.env.WEB_URL}/bookings/${booking._id}">Manage your booking</a></p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} In and Out Car Wash. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Booking confirmation email sent:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send booking confirmation:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
