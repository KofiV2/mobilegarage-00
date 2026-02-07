/**
 * Firebase Cloud Functions for 3ON Car Wash
 * - Email notifications for staff orders
 * - Telegram notifications for all orders
 * - Custom claims management for role-based auth
 * - Server-side booking creation with price verification
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as https from 'https';
import { calculateTotalPrice } from '../../packages/shared/src/utils/pricing';
import { PACKAGES } from '../../packages/shared/src/config/packages';
import type {
  PackageId,
  VehicleTypeId,
  VehicleSize,
  SelectedAddOn,
} from '../../packages/shared/src/types';

admin.initializeApp();

const db = admin.firestore();

// ============================================================
// SMTP Email Configuration (uses process.env)
// ============================================================

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

const getSmtpConfig = (): SmtpConfig => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
  from: process.env.SMTP_FROM || '3ON Car Wash',
});

const createTransporter = () => {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
};

// ============================================================
// Formatting Helpers
// ============================================================

const formatPrice = (price: number | undefined): string =>
  `AED ${price || 0}`;

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// ============================================================
// Order Data Interface
// ============================================================

interface OrderData {
  source?: string;
  enteredBy?: string;
  date?: string;
  time?: string;
  customerData?: { name?: string; phone?: string };
  userName?: string;
  userPhone?: string;
  guestPhone?: string;
  vehicleType?: string;
  vehicleSize?: string;
  package?: string;
  vehiclesInArea?: number;
  location?: {
    area?: string;
    street?: string;
    villa?: string;
    emirate?: string;
    latitude?: number;
    longitude?: number;
    coordinates?: { lat?: number; lng?: number };
    instructions?: string;
  };
  vehicleImageUrl?: string;
  notes?: string;
  paymentMethod?: string;
  price?: number;
}

// ============================================================
// Email Template
// ============================================================

const generateEmailTemplate = (order: OrderData, bookingId: string): string => {
  const packageNames: Record<string, string> = {
    platinum: 'Platinum',
    titanium: 'Titanium',
    diamond: 'Diamond',
  };

  const vehicleTypes: Record<string, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    motorcycle: 'Motorcycle',
    caravan: 'Caravan',
    boat: 'Boat',
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
          <span class="value">${vehicleTypes[order.vehicleType || ''] || order.vehicleType}</span>
        </div>
        ${order.vehicleSize ? `
        <div class="row">
          <span class="label">Vehicle Size:</span>
          <span class="value">${order.vehicleSize}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">Package:</span>
          <span class="value">${packageNames[order.package || ''] || order.package}</span>
        </div>
        ${(order.vehiclesInArea ?? 0) > 1 ? `
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
        <p><a href="${order.vehicleImageUrl}" style="color: #047857;" target="_blank">View Vehicle Photo</a></p>
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

// ============================================================
// Telegram Helpers
// ============================================================

const sendTelegramMessage = (
  botToken: string,
  chatId: string,
  message: string
): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });

    const options: https.RequestOptions = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk: string) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(
            new Error(`Telegram API error: ${res.statusCode} - ${body}`)
          );
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const generateTelegramMessage = (
  order: OrderData,
  bookingId: string
): string => {
  const packageNames: Record<string, string> = {
    platinum: 'Platinum',
    titanium: 'Titanium',
    diamond: 'Diamond',
  };

  const vehicleTypes: Record<string, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    motorcycle: 'Motorcycle',
    caravan: 'Caravan',
    boat: 'Boat',
  };

  const orderIdShort = bookingId.slice(-6).toUpperCase();
  const isStaffOrder = order.source === 'staff';

  const customerName =
    order.customerData?.name || order.userName || 'Guest';
  const customerPhone =
    order.customerData?.phone ||
    order.guestPhone ||
    order.userPhone ||
    'N/A';

  const vehicleType =
    vehicleTypes[order.vehicleType || ''] || order.vehicleType || 'N/A';
  const vehicleSize = order.vehicleSize ? ` (${order.vehicleSize})` : '';
  const packageName =
    packageNames[order.package || ''] || order.package || 'N/A';

  const area = order.location?.area || 'N/A';
  const villa = order.location?.villa || '';
  const street = order.location?.street || '';
  const emirate = order.location?.emirate || '';

  let locationStr = area;
  if (emirate) locationStr = `${emirate}, ${locationStr}`;
  if (street) locationStr += `, ${street}`;
  if (villa) locationStr += `, Villa ${villa}`;

  const lat =
    order.location?.latitude || order.location?.coordinates?.lat;
  const lng =
    order.location?.longitude || order.location?.coordinates?.lng;
  const mapsLink =
    lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  const paymentMethod =
    order.paymentMethod === 'cash'
      ? 'Cash'
      : order.paymentMethod === 'link'
        ? 'Payment Link'
        : 'Card';

  let message = `\u{1F697} <b>NEW ORDER #${orderIdShort}</b>\n\n`;
  message += `\u{1F464} <b>Customer:</b> ${customerName}\n`;
  message += `\u{1F4DE} <b>Phone:</b> ${customerPhone}\n\n`;
  message += `\u{1F699} <b>Vehicle:</b> ${vehicleType}${vehicleSize}\n`;
  message += `\u{1F4E6} <b>Package:</b> ${packageName}\n`;
  message += `\u{1F4B0} <b>Price:</b> AED ${order.price || 0}\n`;
  message += `\u{1F4B3} <b>Payment:</b> ${paymentMethod}\n\n`;
  message += `\u{1F4CD} <b>Location:</b> ${locationStr}\n`;
  if (mapsLink) {
    message += `\u{1F5FA} <b>Map:</b> ${mapsLink}\n`;
  }
  message += `\n`;
  message += `\u{1F4C5} <b>Date:</b> ${order.date || 'N/A'}\n`;
  message += `\u{23F0} <b>Time:</b> ${order.time || 'N/A'}\n\n`;

  if (order.location?.instructions || order.notes) {
    message += `\u{1F4DD} <b>Notes:</b> ${order.location?.instructions || order.notes}\n\n`;
  }

  message += `\u{1F4F1} <b>Source:</b> ${isStaffOrder ? `Staff (${order.enteredBy || 'Unknown'})` : 'Customer Booking'}`;

  return message;
};

// ============================================================
// Cloud Function: Send email notification for staff orders
// ============================================================

export const sendStaffOrderNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const order = snap.data() as OrderData;
    const bookingId = context.params.bookingId;

    if (order.source !== 'staff') {
      console.log('Skipping notification: Not a staff order');
      return null;
    }

    const smtpConfig = getSmtpConfig();
    const ownerEmail = process.env.OWNER_EMAIL;

    if (!smtpConfig.user || !smtpConfig.password || !ownerEmail) {
      console.error(
        'Email configuration not set. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, OWNER_EMAIL in functions/.env'
      );
      return null;
    }

    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"${smtpConfig.from}" <${smtpConfig.user}>`,
        to: ownerEmail,
        subject: `New Staff Order #${bookingId.slice(-6).toUpperCase()} - ${formatPrice(order.price)}`,
        html: generateEmailTemplate(order, bookingId),
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email notification sent for order ${bookingId}`);

      await snap.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, bookingId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending email notification:', error);

      await snap.ref.update({
        notificationSent: false,
        notificationError: errorMessage,
      });

      throw new functions.https.HttpsError(
        'internal',
        'Failed to send email notification'
      );
    }
  });

// ============================================================
// HTTP Function: Test email configuration
// ============================================================

export const testEmailConfig = functions.https.onRequest(async (_req, res) => {
  const smtpConfig = getSmtpConfig();
  const ownerEmail = process.env.OWNER_EMAIL;

  const configStatus = {
    smtp: {
      host: smtpConfig.host ? 'Set' : 'Not set',
      port: smtpConfig.port ? 'Set' : 'Not set',
      user: smtpConfig.user ? 'Set' : 'Not set',
      password: smtpConfig.password ? 'Set' : 'Not set',
      from: smtpConfig.from || 'Not set (will use default)',
    },
    owner: {
      email: ownerEmail ? 'Set' : 'Not set',
    },
  };

  const allSet =
    smtpConfig.host && smtpConfig.port && smtpConfig.user &&
    smtpConfig.password && ownerEmail;

  res.json({
    status: allSet ? 'Configuration complete' : 'Missing configuration',
    config: configStatus,
    instructions: allSet
      ? 'Ready to send emails!'
      : 'Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, OWNER_EMAIL in functions/.env',
  });
});

// ============================================================
// Cloud Function: Send Telegram notification for ALL new orders
// ============================================================

export const sendTelegramNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const order = snap.data() as OrderData;
    const bookingId = context.params.bookingId;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.log('Telegram configuration not set. Skipping notification.');
      return null;
    }

    try {
      const message = generateTelegramMessage(order, bookingId);
      await sendTelegramMessage(botToken, chatId, message);
      console.log(`Telegram notification sent for order ${bookingId}`);

      await snap.ref.update({
        telegramNotificationSent: true,
        telegramNotificationSentAt:
          admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, bookingId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending Telegram notification:', error);

      await snap.ref.update({
        telegramNotificationSent: false,
        telegramNotificationError: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  });

// ============================================================
// HTTP Function: Test Telegram configuration
// ============================================================

export const testTelegramConfig = functions.https.onRequest(
  async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const configStatus = {
      bot_token: botToken ? 'Set' : 'Not set',
      chat_id: chatId ? 'Set' : 'Not set',
    };

    const allSet = botToken && chatId;

    if (req.query.test === 'true' && allSet) {
      try {
        await sendTelegramMessage(
          botToken,
          chatId,
          '\u2705 <b>Test Message</b>\n\nYour Telegram notifications are configured correctly!\n\n\u{1F697} 3ON Car Wash'
        );
        res.json({
          status: 'Test message sent successfully!',
          config: configStatus,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        res.json({
          status: 'Test failed',
          error: errorMessage,
          config: configStatus,
        });
      }
    } else {
      res.json({
        status: allSet ? 'Configuration complete' : 'Missing configuration',
        config: configStatus,
        instructions: allSet
          ? 'Add ?test=true to send a test message'
          : 'Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in functions/.env',
      });
    }
  }
);

// ============================================================
// Cloud Function: Set User Custom Claims (Role-based auth)
// ============================================================

export const setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const callerClaims = context.auth.token;
  if (callerClaims.role !== 'manager') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only managers can assign roles'
    );
  }

  const { uid, role } = data;
  if (!uid || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid and role are required'
    );
  }

  const validRoles = ['customer', 'staff', 'manager'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid role. Must be one of: ${validRoles.join(', ')}`
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });

    await db.collection('auditLog').add({
      action: 'role_changed',
      performedBy: context.auth.uid,
      performedByRole: 'manager',
      targetUid: uid,
      newRole: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Role '${role}' assigned to user ${uid} by ${context.auth.uid}`);
    return { success: true, uid, role };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to set role: ${errorMessage}`
    );
  }
});

// ============================================================
// Cloud Function: Auto-assign 'customer' role to new users
// ============================================================

export const onNewUser = functions.auth.user().onCreate(async (user) => {
  try {
    await admin.auth().setCustomUserClaims(user.uid, { role: 'customer' });
    console.log(`Default 'customer' role assigned to new user ${user.uid}`);
  } catch (error) {
    console.error(`Failed to assign default role to user ${user.uid}:`, error);
  }
});

// ============================================================
// Cloud Function: Server-side booking creation
// ============================================================

interface CreateBookingData {
  vehicleType: VehicleTypeId;
  vehicleSize?: VehicleSize;
  packageId: PackageId;
  addOns?: SelectedAddOn[];
  date: string;
  timeSlot: string;
  location: {
    area: string;
    street?: string;
    villa?: string;
    emirate?: string;
    coordinates?: { lat: number; lng: number };
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  paymentMethod: string;
  isMonthlySubscription?: boolean;
  guestPhone?: string;
  userName?: string;
  userPhone?: string;
  vehicleId?: string;
  vehiclesInArea?: number;
  vehicleImageUrl?: string;
  notes?: string;
  customerData?: { name: string; phone: string };
  source?: string;
  enteredBy?: string;
}

export const createBooking = functions.https.onCall(
  async (data: CreateBookingData, context) => {
    const {
      vehicleType,
      vehicleSize,
      packageId,
      addOns = [],
      date,
      timeSlot,
      location,
      paymentMethod,
      isMonthlySubscription = false,
      guestPhone,
      userName,
      userPhone,
      vehicleId,
      vehiclesInArea,
      vehicleImageUrl,
      notes,
      customerData,
      source,
      enteredBy,
    } = data;

    // Validate required fields
    if (!vehicleType || !packageId || !date || !timeSlot || !location || !paymentMethod) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: vehicleType, packageId, date, timeSlot, location, paymentMethod'
      );
    }

    // Validate package exists
    if (!PACKAGES[packageId]) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid package: ${packageId}`
      );
    }

    // Determine user identity
    const userId = context.auth?.uid || 'guest';
    const isStaffOrder = source === 'staff';

    // If staff order, verify caller is staff or manager
    if (isStaffOrder && context.auth) {
      const callerRole = context.auth.token.role;
      if (callerRole !== 'staff' && callerRole !== 'manager') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only staff or managers can create staff orders'
        );
      }
    }

    // Calculate price server-side
    const { totalPrice, basePrice, addOnsTotal } = calculateTotalPrice(
      packageId,
      vehicleType,
      vehicleSize || null,
      addOns,
      isMonthlySubscription
    );

    if (totalPrice === null || basePrice === null) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Cannot calculate price for package '${packageId}' with vehicle '${vehicleType}'`
      );
    }

    // Build booking document
    const bookingData: Record<string, unknown> = {
      userId,
      source: isStaffOrder ? 'staff' : 'customer',
      vehicleType,
      package: packageId,
      date,
      time: timeSlot,
      location,
      paymentMethod,
      price: basePrice,
      totalPrice,
      addOnsPrice: addOnsTotal,
      isMonthlySubscription,
      status: isStaffOrder ? 'confirmed' : 'pending',
      paymentStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Optional fields
    if (vehicleSize) bookingData.vehicleSize = vehicleSize;
    if (guestPhone) bookingData.guestPhone = guestPhone;
    if (userName) bookingData.userName = userName;
    if (userPhone) bookingData.userPhone = userPhone;
    if (vehicleId) bookingData.vehicleId = vehicleId;
    if (vehiclesInArea) bookingData.vehiclesInArea = vehiclesInArea;
    if (vehicleImageUrl) bookingData.vehicleImageUrl = vehicleImageUrl;
    if (notes) bookingData.notes = notes;
    if (customerData) bookingData.customerData = customerData;
    if (enteredBy) bookingData.enteredBy = enteredBy;

    // Add-ons as map for Firestore
    if (addOns.length > 0) {
      const addOnsMap: Record<string, boolean | number> = {};
      addOns
        .filter((a) => a.enabled)
        .forEach((addon) => {
          addOnsMap[addon.id] = addon.customAmount ?? addon.price;
        });
      bookingData.addOns = addOnsMap;
    }

    try {
      const docRef = await db.collection('bookings').add(bookingData);

      // Write audit log
      await db.collection('auditLog').add({
        action: isStaffOrder ? 'staff_order_created' : 'booking_created',
        performedBy: userId,
        performedByRole: isStaffOrder
          ? (context.auth?.token.role || 'staff')
          : 'customer',
        targetId: docRef.id,
        targetCollection: 'bookings',
        details: { packageId, vehicleType, totalPrice, paymentMethod },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `Booking ${docRef.id} created by ${userId} - ${packageId} - AED ${totalPrice}`
      );

      return {
        bookingId: docRef.id,
        calculatedPrice: totalPrice,
        basePrice,
        addOnsTotal,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating booking:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to create booking: ${errorMessage}`
      );
    }
  }
);
