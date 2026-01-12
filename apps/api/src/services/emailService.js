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
      console.warn('Email service not initialized - skipping booking confirmation');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const scheduledDate = new Date(booking.scheduled_date || booking.scheduledDate);
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: `Booking Confirmed - ${booking.booking_number || booking.bookingNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .button { display: inline-block; padding: 12px 30px; background: #43e97b; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .important-note { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Booking Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name || user.firstName},</p>
                <p>Your booking has been confirmed. We look forward to serving you!</p>

                <div class="booking-details">
                  <h2>Booking Details</h2>
                  <div class="detail-row">
                    <strong>Booking Number:</strong>
                    <span>${booking.booking_number || booking.bookingNumber}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Date & Time:</strong>
                    <span>${formattedDate}</span>
                  </div>
                  ${booking.services && booking.services.name ? `
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${booking.services.name}</span>
                  </div>
                  ` : booking.serviceName ? `
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${booking.serviceName}</span>
                  </div>
                  ` : ''}
                  ${booking.vehicles ? `
                  <div class="detail-row">
                    <strong>Vehicle:</strong>
                    <span>${booking.vehicles.make} ${booking.vehicles.model} ${booking.vehicles.year}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <strong>Total Price:</strong>
                    <span style="color: #43e97b; font-weight: bold; font-size: 18px;">AED ${booking.total_price || booking.totalPrice}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Status:</strong>
                    <span style="color: #43e97b; font-weight: bold; text-transform: capitalize;">${booking.status}</span>
                  </div>
                </div>

                <div class="important-note">
                  <strong>📌 Important Information:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Please arrive 5 minutes before your scheduled time</li>
                    <li>Have your booking number ready: <strong>${booking.booking_number || booking.bookingNumber}</strong></li>
                    <li>Our professional team will take great care of your vehicle</li>
                    <li>You'll receive updates as your booking status changes</li>
                  </ul>
                </div>

                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/bookings" class="button">View My Bookings</a>
                </p>

                <p style="font-size: 14px; color: #666;">
                  Need to make changes? Visit your bookings page to manage or cancel this appointment.
                </p>

                <p>Thank you for choosing In and Out Car Wash!</p>
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
      console.log('✅ Booking confirmation email sent:', info.messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send booking confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking status update email
   */
  async sendBookingStatusUpdate(user, booking, oldStatus, newStatus) {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping status update');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const statusMessages = {
        pending: {
          title: '⏳ Your Booking is Pending',
          message: 'Your booking is currently pending confirmation. We will notify you once it is confirmed.',
          color: '#ffc107'
        },
        confirmed: {
          title: '✅ Your Booking is Confirmed',
          message: 'Great news! Your booking has been confirmed. We look forward to serving you.',
          color: '#43e97b'
        },
        in_progress: {
          title: '🚀 Service in Progress',
          message: 'Your vehicle is currently being serviced. Our team is taking great care of it!',
          color: '#667eea'
        },
        completed: {
          title: '🎉 Service Completed',
          message: 'Your car wash has been completed! Thank you for choosing In and Out Car Wash.',
          color: '#4caf50'
        },
        cancelled: {
          title: '❌ Booking Cancelled',
          message: 'Your booking has been cancelled. If this was a mistake, please contact us or create a new booking.',
          color: '#f44336'
        },
        no_show: {
          title: '⚠️ No Show Recorded',
          message: 'We noticed you did not arrive for your scheduled appointment. Please contact us if you need to reschedule.',
          color: '#ff9800'
        }
      };

      const statusInfo = statusMessages[newStatus] || statusMessages.pending;
      const scheduledDate = new Date(booking.scheduled_date || booking.scheduledDate);
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: `Booking Status Update - ${booking.booking_number || booking.bookingNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .status-banner { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; border: 2px solid ${statusInfo.color}; }
              .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .button { display: inline-block; padding: 12px 30px; background: ${statusInfo.color}; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${statusInfo.title}</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name || user.firstName},</p>

                <div class="status-banner">
                  <p style="font-size: 18px; font-weight: bold; color: ${statusInfo.color}; margin: 0;">
                    Status Updated: ${oldStatus.toUpperCase().replace('_', ' ')} → ${newStatus.toUpperCase().replace('_', ' ')}
                  </p>
                </div>

                <p>${statusInfo.message}</p>

                <div class="booking-details">
                  <h2>Booking Details</h2>
                  <div class="detail-row">
                    <strong>Booking Number:</strong>
                    <span>${booking.booking_number || booking.bookingNumber}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Date & Time:</strong>
                    <span>${formattedDate}</span>
                  </div>
                  ${booking.services && booking.services.name ? `
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${booking.services.name}</span>
                  </div>
                  ` : booking.serviceName ? `
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${booking.serviceName}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <strong>Total Price:</strong>
                    <span style="font-weight: bold;">AED ${booking.total_price || booking.totalPrice}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Current Status:</strong>
                    <span style="color: ${statusInfo.color}; font-weight: bold; text-transform: capitalize;">${newStatus.replace('_', ' ')}</span>
                  </div>
                </div>

                ${newStatus === 'completed' ? `
                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/bookings/${booking.id}" class="button">Rate Your Experience</a>
                </p>
                <p style="text-align: center; color: #666; font-size: 14px;">
                  We would love to hear your feedback!
                </p>
                ` : `
                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/bookings" class="button">View Booking Details</a>
                </p>
                `}

                ${newStatus === 'cancelled' || newStatus === 'no_show' ? `
                <p style="text-align: center; margin-top: 20px;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/services" style="color: #667eea;">Book Another Service</a>
                </p>
                ` : ''}

                <p>Thank you for choosing In and Out Car Wash!</p>
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
      console.log(`✅ Booking status update email sent (${oldStatus} -> ${newStatus}):`, info.messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send booking status update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation(user, booking, reason) {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping cancellation email');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const scheduledDate = new Date(booking.scheduled_date || booking.scheduledDate);
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: `Booking Cancelled - ${booking.booking_number || booking.bookingNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Booking Cancelled</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name || user.firstName},</p>
                <p>Your booking has been cancelled as requested.</p>

                <div class="booking-details">
                  <h2>Cancelled Booking Details</h2>
                  <div class="detail-row">
                    <strong>Booking Number:</strong>
                    <span>${booking.booking_number || booking.bookingNumber}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Date & Time:</strong>
                    <span>${formattedDate}</span>
                  </div>
                  ${booking.services && booking.services.name ? `
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${booking.services.name}</span>
                  </div>
                  ` : ''}
                  ${reason ? `
                  <div class="detail-row">
                    <strong>Cancellation Reason:</strong>
                    <span>${reason}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <strong>Cancelled At:</strong>
                    <span>${new Date().toLocaleString()}</span>
                  </div>
                </div>

                <div class="info-box">
                  <strong>📋 Refund Information:</strong>
                  <p style="margin: 10px 0 0 0;">
                    ${booking.payment_status === 'paid' ?
                      'If you have already paid, your refund will be processed within 5-7 business days.' :
                      'No payment was made for this booking.'}
                  </p>
                </div>

                <p>We're sorry to see you go! If you'd like to reschedule or book a new appointment, we're here to help.</p>

                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/services" class="button">Book a New Service</a>
                </p>

                <p style="text-align: center; color: #666; font-size: 14px;">
                  Have questions? Contact our support team anytime.
                </p>

                <p>Thank you for considering In and Out Car Wash!</p>
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
      console.log('✅ Booking cancellation email sent:', info.messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send booking cancellation email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking reminder email (1 day before appointment)
   */
  async sendBookingReminder(user, booking) {
    if (!this.initialized) {
      console.warn('Email service not initialized - skipping reminder');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const scheduledDate = new Date(booking.scheduled_date || booking.scheduledDate);
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'In and Out Car Wash'}" <${process.env.EMAIL_FROM || 'noreply@carwash.com'}>`,
        to: user.email,
        subject: `Reminder: Your Car Wash Appointment Tomorrow - ${booking.booking_number || booking.bookingNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .reminder-banner { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
              .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .checklist { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Appointment Reminder</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name || user.firstName},</p>

                <div class="reminder-banner">
                  <h2 style="margin: 0; color: #f57c00;">Your appointment is tomorrow!</h2>
                  <p style="font-size: 18px; margin: 10px 0 0 0;">
                    Don't forget - we're looking forward to serving you.
                  </p>
                </div>

                <div class="booking-details">
                  <h2>Appointment Details</h2>
                  <div class="detail-row">
                    <strong>Booking Number:</strong>
                    <span>${booking.booking_number || booking.bookingNumber}</span>
                  </div>
                  <div class="detail-row">
                    <strong>Date & Time:</strong>
                    <span style="font-weight: bold; color: #667eea;">${formattedDate}</span>
                  </div>
                  ${booking.services && booking.services.name ? `
                  <div class="detail-row">
                    <strong>Service:</strong>
                    <span>${booking.services.name}</span>
                  </div>
                  ` : ''}
                  ${booking.vehicles ? `
                  <div class="detail-row">
                    <strong>Vehicle:</strong>
                    <span>${booking.vehicles.make} ${booking.vehicles.model}</span>
                  </div>
                  ` : ''}
                  <div class="detail-row">
                    <strong>Total Price:</strong>
                    <span style="font-weight: bold;">AED ${booking.total_price || booking.totalPrice}</span>
                  </div>
                </div>

                <div class="checklist">
                  <strong>✅ Pre-Appointment Checklist:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Arrive 5 minutes before your scheduled time</li>
                    <li>Have your booking number ready: <strong>${booking.booking_number || booking.bookingNumber}</strong></li>
                    <li>Remove personal items from your vehicle</li>
                    <li>Bring payment if not already paid</li>
                  </ul>
                </div>

                <p style="text-align: center;">
                  <a href="${process.env.WEB_URL || 'http://localhost:5173'}/bookings" class="button">View Booking Details</a>
                </p>

                <p style="text-align: center; color: #666; font-size: 14px;">
                  Need to cancel or reschedule? Please contact us as soon as possible.
                </p>

                <p>We look forward to serving you tomorrow!</p>
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
      console.log('✅ Booking reminder email sent:', info.messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send booking reminder:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
