/**
 * Firebase Cloud Functions for 3ON Car Wash
 * Email notifications for staff orders
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

/**
 * Create SMTP transporter using environment config
 * Set these using: firebase functions:config:set smtp.host="smtp.gmail.com" smtp.port="587" etc.
 */
const createTransporter = () => {
  const smtpConfig = functions.config().smtp || {};

  return nodemailer.createTransport({
    host: smtpConfig.host || 'smtp.gmail.com',
    port: parseInt(smtpConfig.port) || 587,
    secure: false, // TLS
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password
    }
  });
};

/**
 * Format price with currency
 */
const formatPrice = (price) => `AED ${price || 0}`;

/**
 * Format date for display
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generate HTML email template for staff orders
 */
const generateEmailTemplate = (order, bookingId) => {
  const packageNames = {
    platinum: 'Platinum',
    titanium: 'Titanium',
    diamond: 'Diamond'
  };

  const vehicleTypes = {
    sedan: 'Sedan',
    suv: 'SUV',
    motorcycle: 'Motorcycle',
    caravan: 'Caravan',
    boat: 'Boat'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section-title { font-size: 14px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #047857; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .label { color: #6b7280; }
    .value { font-weight: 600; color: #111827; }
    .highlight { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 10px; }
    .highlight .price { font-size: 28px; font-weight: bold; color: #047857; }
    .staff-badge { display: inline-block; background: #047857; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .btn { display: inline-block; background: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
    .image-link { color: #047857; text-decoration: none; }
    .image-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Staff Order</h1>
      <p>Order #${bookingId.slice(-6).toUpperCase()}</p>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">Order Details</div>
        <div class="row">
          <span class="label">Entered By:</span>
          <span class="value"><span class="staff-badge">${order.enteredBy || 'Staff'}</span></span>
        </div>
        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${formatDate(order.date)}</span>
        </div>
        <div class="row">
          <span class="label">Time:</span>
          <span class="value">${order.time || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="row">
          <span class="label">Name:</span>
          <span class="value">${order.customerData?.name || 'Not provided'}</span>
        </div>
        <div class="row">
          <span class="label">Phone:</span>
          <span class="value">${order.customerData?.phone || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Service Details</div>
        <div class="row">
          <span class="label">Vehicle Type:</span>
          <span class="value">${vehicleTypes[order.vehicleType] || order.vehicleType}</span>
        </div>
        ${order.vehicleSize ? `
        <div class="row">
          <span class="label">Vehicle Size:</span>
          <span class="value">${order.vehicleSize}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">Package:</span>
          <span class="value">${packageNames[order.package] || order.package}</span>
        </div>
        ${order.vehiclesInArea > 1 ? `
        <div class="row">
          <span class="label">Vehicles in Area:</span>
          <span class="value">${order.vehiclesInArea}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Location</div>
        <div class="row">
          <span class="label">Area:</span>
          <span class="value">${order.location?.area || 'N/A'}</span>
        </div>
        ${order.location?.street ? `
        <div class="row">
          <span class="label">Street:</span>
          <span class="value">${order.location.street}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">Villa/House:</span>
          <span class="value">${order.location?.villa || 'N/A'}</span>
        </div>
      </div>

      ${order.vehicleImageUrl ? `
      <div class="section">
        <div class="section-title">Vehicle Photo</div>
        <p><a href="${order.vehicleImageUrl}" class="image-link" target="_blank">View Vehicle Photo</a></p>
      </div>
      ` : ''}

      ${order.notes ? `
      <div class="section">
        <div class="section-title">Notes</div>
        <p>${order.notes}</p>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Payment</div>
        <div class="row">
          <span class="label">Method:</span>
          <span class="value">${order.paymentMethod === 'cash' ? 'Cash' : 'Card'}</span>
        </div>
        <div class="highlight">
          <div class="row">
            <span class="label">Total Amount:</span>
            <span class="price">${formatPrice(order.price)}</span>
          </div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://your-domain.com/manager" class="btn">View in Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <p>3ON Mobile Car Wash - Staff Order Notification</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Cloud Function: Send email notification when staff creates an order
 * Triggers on new document creation in the 'bookings' collection
 */
exports.sendStaffOrderNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const bookingId = context.params.bookingId;

    // Only send notification for staff-entered orders
    if (order.source !== 'staff') {
      console.log('Skipping notification: Not a staff order');
      return null;
    }

    const ownerConfig = functions.config().owner || {};
    const smtpConfig = functions.config().smtp || {};

    // Check if configuration is set
    if (!smtpConfig.user || !smtpConfig.password || !ownerConfig.email) {
      console.error('Email configuration not set. Please run:');
      console.error('firebase functions:config:set smtp.host="smtp.gmail.com" smtp.port="587" smtp.user="your@gmail.com" smtp.password="your-app-password" smtp.from="3ON Car Wash" owner.email="owner@email.com"');
      return null;
    }

    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"${smtpConfig.from || '3ON Car Wash'}" <${smtpConfig.user}>`,
        to: ownerConfig.email,
        subject: `New Staff Order #${bookingId.slice(-6).toUpperCase()} - ${formatPrice(order.price)}`,
        html: generateEmailTemplate(order, bookingId)
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email notification sent successfully for order ${bookingId}`);

      // Optionally update the order to mark notification as sent
      await snap.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, bookingId };
    } catch (error) {
      console.error('Error sending email notification:', error);

      // Update order with error info
      await snap.ref.update({
        notificationSent: false,
        notificationError: error.message
      });

      throw new functions.https.HttpsError('internal', 'Failed to send email notification');
    }
  });

/**
 * HTTP Function: Test email configuration
 * Use this to verify your SMTP settings work
 * Call: https://your-region-your-project.cloudfunctions.net/testEmailConfig
 */
exports.testEmailConfig = functions.https.onRequest(async (req, res) => {
  const smtpConfig = functions.config().smtp || {};
  const ownerConfig = functions.config().owner || {};

  // Don't expose actual credentials
  const configStatus = {
    smtp: {
      host: smtpConfig.host ? 'Set' : 'Not set',
      port: smtpConfig.port ? 'Set' : 'Not set',
      user: smtpConfig.user ? 'Set' : 'Not set',
      password: smtpConfig.password ? 'Set' : 'Not set',
      from: smtpConfig.from || 'Not set (will use default)'
    },
    owner: {
      email: ownerConfig.email ? 'Set' : 'Not set'
    }
  };

  const allSet = smtpConfig.host && smtpConfig.port && smtpConfig.user &&
                 smtpConfig.password && ownerConfig.email;

  res.json({
    status: allSet ? 'Configuration complete' : 'Missing configuration',
    config: configStatus,
    instructions: allSet ? 'Ready to send emails!' :
      'Run: firebase functions:config:set smtp.host="smtp.gmail.com" smtp.port="587" smtp.user="your@gmail.com" smtp.password="your-app-password" owner.email="owner@email.com"'
  });
});
