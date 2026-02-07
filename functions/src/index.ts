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
  userId?: string;
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
// Booking Confirmation Email Template (Bilingual)
// ============================================================

interface BookingData extends OrderData {
  language?: 'en' | 'ar';
  customerEmail?: string;
  totalPrice?: number;
  addOns?: Record<string, boolean | number>;
  status?: string;
}

const translations = {
  en: {
    title: 'Booking Confirmed!',
    subtitle: 'Thank you for choosing 3ON Mobile Car Wash',
    bookingDetails: 'Booking Details',
    bookingId: 'Booking ID',
    date: 'Date',
    time: 'Time Slot',
    status: 'Status',
    confirmed: 'Confirmed',
    pending: 'Pending',
    vehicleDetails: 'Vehicle Details',
    vehicleType: 'Vehicle Type',
    vehicleSize: 'Vehicle Size',
    package: 'Package',
    serviceLocation: 'Service Location',
    area: 'Area',
    street: 'Street',
    villa: 'Villa/House',
    instructions: 'Instructions',
    payment: 'Payment Summary',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    link: 'Payment Link',
    total: 'Total Amount',
    whatNext: 'What\'s Next?',
    nextSteps: [
      'Our team will arrive at your location on the scheduled date and time.',
      'Please ensure the vehicle is accessible and parked in a suitable spot.',
      'Have your payment ready if you selected cash payment.',
    ],
    questions: 'Questions?',
    contactUs: 'Contact us anytime:',
    phone: 'Phone',
    footer: '3ON Mobile Car Wash - We Come To You!',
    automated: 'This is an automated confirmation. Please do not reply to this email.',
    needToChange: 'Need to make changes?',
    reschedule: 'Reschedule Booking',
    cancel: 'Cancel Booking',
    manageNote: 'Changes must be made at least 2 hours before your appointment.',
  },
  ar: {
    title: 'تم تأكيد الحجز!',
    subtitle: 'شكراً لاختيارك 3ON لغسيل السيارات المتنقل',
    bookingDetails: 'تفاصيل الحجز',
    bookingId: 'رقم الحجز',
    date: 'التاريخ',
    time: 'الوقت',
    status: 'الحالة',
    confirmed: 'مؤكد',
    pending: 'قيد الانتظار',
    vehicleDetails: 'تفاصيل المركبة',
    vehicleType: 'نوع المركبة',
    vehicleSize: 'حجم المركبة',
    package: 'الباقة',
    serviceLocation: 'موقع الخدمة',
    area: 'المنطقة',
    street: 'الشارع',
    villa: 'الفيلا/المنزل',
    instructions: 'التعليمات',
    payment: 'ملخص الدفع',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقداً',
    card: 'بطاقة',
    link: 'رابط الدفع',
    total: 'المبلغ الإجمالي',
    whatNext: 'ماذا بعد؟',
    nextSteps: [
      'سيصل فريقنا إلى موقعك في التاريخ والوقت المحددين.',
      'يرجى التأكد من أن السيارة متاحة ومركونة في مكان مناسب.',
      'جهز المبلغ إذا اخترت الدفع نقداً.',
    ],
    questions: 'أسئلة؟',
    contactUs: 'تواصل معنا في أي وقت:',
    phone: 'الهاتف',
    footer: '3ON لغسيل السيارات المتنقل - نأتي إليك!',
    automated: 'هذا تأكيد آلي. يرجى عدم الرد على هذا البريد.',
    needToChange: 'هل تحتاج لإجراء تغييرات؟',
    reschedule: 'إعادة جدولة الحجز',
    cancel: 'إلغاء الحجز',
    manageNote: 'يجب إجراء التغييرات قبل موعدك بساعتين على الأقل.',
  },
};

const generateBookingConfirmationEmail = (
  booking: BookingData,
  bookingId: string,
  lang: 'en' | 'ar' = 'en'
): string => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const align = isRtl ? 'right' : 'left';

  const packageNames: Record<string, Record<string, string>> = {
    en: { platinum: 'Platinum', titanium: 'Titanium', diamond: 'Diamond' },
    ar: { platinum: 'بلاتينيوم', titanium: 'تيتانيوم', diamond: 'دايموند' },
  };

  const vehicleTypes: Record<string, Record<string, string>> = {
    en: { sedan: 'Sedan', suv: 'SUV', motorcycle: 'Motorcycle', caravan: 'Caravan', boat: 'Boat' },
    ar: { sedan: 'سيدان', suv: 'دفع رباعي', motorcycle: 'دراجة نارية', caravan: 'كرفان', boat: 'قارب' },
  };

  const packageName = packageNames[lang][booking.package || ''] || booking.package || 'N/A';
  const vehicleType = vehicleTypes[lang][booking.vehicleType || ''] || booking.vehicleType || 'N/A';
  const price = booking.totalPrice ?? booking.price ?? 0;
  const statusText = booking.status === 'confirmed' ? t.confirmed : t.pending;
  
  let paymentMethodText = t.cash;
  if (booking.paymentMethod === 'card') paymentMethodText = t.card;
  else if (booking.paymentMethod === 'link') paymentMethodText = t.link;

  // Generate manage booking URLs (using web app base URL from env or default)
  const webAppUrl = process.env.WEB_APP_URL || 'https://3on.ae';
  const rescheduleUrl = `${webAppUrl}/booking/${bookingId}/reschedule`;
  const cancelUrl = `${webAppUrl}/booking/${bookingId}/cancel`;

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; background: #f0f4f8; direction: ${dir}; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 12px 0 0; opacity: 0.9; font-size: 16px; }
    .check-icon { font-size: 48px; margin-bottom: 15px; }
    .booking-id { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 25px; margin-top: 15px; font-weight: 600; letter-spacing: 1px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
    .section { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 13px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #10b981; text-align: ${align}; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; flex-direction: ${isRtl ? 'row-reverse' : 'row'}; }
    .label { color: #64748b; font-size: 14px; }
    .value { font-weight: 600; color: #1e293b; font-size: 14px; }
    .highlight-box { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 12px; margin-top: 15px; border: 1px solid #a7f3d0; }
    .price-row { display: flex; justify-content: space-between; align-items: center; flex-direction: ${isRtl ? 'row-reverse' : 'row'}; }
    .price { font-size: 32px; font-weight: 800; color: #059669; }
    .status-badge { display: inline-block; background: #059669; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .next-steps { background: #fffbeb; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #fde68a; }
    .next-steps h3 { color: #b45309; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: ${align}; }
    .next-steps ol { margin: 0; padding-${isRtl ? 'right' : 'left'}: 20px; color: #92400e; }
    .next-steps li { margin-bottom: 8px; }
    .contact-box { background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center; }
    .contact-box h3 { color: #475569; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; }
    .contact-box p { margin: 5px 0; color: #334155; }
    .contact-box a { color: #059669; font-weight: 600; text-decoration: none; }
    .action-box { background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center; border: 1px solid #fde68a; }
    .action-box h3 { color: #92400e; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; }
    .action-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .btn-reschedule { background: #059669; color: white !important; }
    .btn-cancel { background: #dc2626; color: white !important; }
    .action-note { margin-top: 12px; font-size: 12px; color: #78716c; }
    .footer { text-align: center; padding: 25px; color: #64748b; font-size: 12px; background: #f8fafc; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; }
    .footer p { margin: 5px 0; }
    .logo-text { font-weight: 700; color: #059669; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="check-icon">✓</div>
      <h1>${t.title}</h1>
      <p>${t.subtitle}</p>
      <div class="booking-id">#${bookingId.slice(-6).toUpperCase()}</div>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">${t.bookingDetails}</div>
        <div class="row">
          <span class="label">${t.bookingId}:</span>
          <span class="value">${bookingId.slice(-6).toUpperCase()}</span>
        </div>
        <div class="row">
          <span class="label">${t.date}:</span>
          <span class="value">${formatDate(booking.date)}</span>
        </div>
        <div class="row">
          <span class="label">${t.time}:</span>
          <span class="value">${booking.time || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">${t.status}:</span>
          <span class="value"><span class="status-badge">${statusText}</span></span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t.vehicleDetails}</div>
        <div class="row">
          <span class="label">${t.vehicleType}:</span>
          <span class="value">${vehicleType}</span>
        </div>
        ${booking.vehicleSize ? `
        <div class="row">
          <span class="label">${t.vehicleSize}:</span>
          <span class="value">${booking.vehicleSize}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">${t.package}:</span>
          <span class="value">${packageName}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t.serviceLocation}</div>
        <div class="row">
          <span class="label">${t.area}:</span>
          <span class="value">${booking.location?.area || 'N/A'}</span>
        </div>
        ${booking.location?.street ? `
        <div class="row">
          <span class="label">${t.street}:</span>
          <span class="value">${booking.location.street}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">${t.villa}:</span>
          <span class="value">${booking.location?.villa || 'N/A'}</span>
        </div>
        ${booking.location?.instructions ? `
        <div class="row">
          <span class="label">${t.instructions}:</span>
          <span class="value">${booking.location.instructions}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">${t.payment}</div>
        <div class="row">
          <span class="label">${t.paymentMethod}:</span>
          <span class="value">${paymentMethodText}</span>
        </div>
        <div class="highlight-box">
          <div class="price-row">
            <span class="label">${t.total}:</span>
            <span class="price">AED ${price}</span>
          </div>
        </div>
      </div>

      <div class="next-steps">
        <h3>📋 ${t.whatNext}</h3>
        <ol>
          ${t.nextSteps.map((step) => `<li>${step}</li>`).join('')}
        </ol>
      </div>

      <div class="contact-box">
        <h3>💬 ${t.questions}</h3>
        <p>${t.contactUs}</p>
        <p><a href="tel:+971501234567">${t.phone}: +971 50 123 4567</a></p>
      </div>

      <div class="action-box">
        <h3>🔄 ${t.needToChange}</h3>
        <div class="action-buttons">
          <a href="${rescheduleUrl}" class="btn btn-reschedule">${t.reschedule}</a>
          <a href="${cancelUrl}" class="btn btn-cancel">${t.cancel}</a>
        </div>
        <p class="action-note">${t.manageNote}</p>
      </div>
    </div>

    <div class="footer">
      <p class="logo-text">🚗 ${t.footer}</p>
      <p>${t.automated}</p>
    </div>
  </div>
</body>
</html>
  `;
};

// ============================================================
// Cloud Function: Send booking confirmation to customer
// ============================================================

export const sendBookingConfirmation = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data() as BookingData;
    const bookingId = context.params.bookingId;

    // Try to get customer email from multiple sources
    let customerEmail: string | null = null;

    // 1. Check if email is directly on booking
    if (booking.customerEmail) {
      customerEmail = booking.customerEmail;
    }

    // 2. Check customerData.email
    const customerData = booking.customerData as { email?: string } | undefined;
    if (!customerEmail && customerData?.email) {
      customerEmail = customerData.email;
    }

    // 3. Try to get from Firebase Auth if we have a userId
    if (!customerEmail && booking.userId && booking.userId !== 'guest') {
      try {
        const user = await admin.auth().getUser(booking.userId as string);
        if (user.email) {
          customerEmail = user.email;
        }
      } catch (err) {
        console.log(`Could not fetch user ${booking.userId}:`, err);
      }
    }

    // Skip if no email available
    if (!customerEmail) {
      console.log(`No customer email for booking ${bookingId}. Skipping confirmation.`);
      return null;
    }

    const smtpConfig = getSmtpConfig();

    if (!smtpConfig.user || !smtpConfig.password) {
      console.error('SMTP configuration not set. Cannot send booking confirmation.');
      return null;
    }

    // Determine language (default to English)
    const lang: 'en' | 'ar' = booking.language === 'ar' ? 'ar' : 'en';

    try {
      const transporter = createTransporter();

      const subject = lang === 'ar'
        ? `تأكيد الحجز #${bookingId.slice(-6).toUpperCase()} - 3ON`
        : `Booking Confirmed #${bookingId.slice(-6).toUpperCase()} - 3ON Car Wash`;

      const mailOptions = {
        from: `"3ON Car Wash" <${smtpConfig.user}>`,
        to: customerEmail,
        subject,
        html: generateBookingConfirmationEmail(booking, bookingId, lang),
      };

      await transporter.sendMail(mailOptions);
      console.log(`Booking confirmation sent to ${customerEmail} for ${bookingId}`);

      await snap.ref.update({
        confirmationEmailSent: true,
        confirmationEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        confirmationEmailTo: customerEmail,
      });

      return { success: true, bookingId, sentTo: customerEmail };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending booking confirmation:', error);

      await snap.ref.update({
        confirmationEmailSent: false,
        confirmationEmailError: errorMessage,
      });

      // Don't throw - we don't want to fail the booking if email fails
      return { success: false, error: errorMessage };
    }
  });

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
  useFreeWash?: boolean;
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
      useFreeWash = false,
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

    // Free wash validation - must be authenticated user
    let freeWashApplied = false;
    if (useFreeWash) {
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Must be logged in to use free wash reward'
        );
      }

      // Check if user has free wash available
      const loyaltyDoc = await db.collection('loyalty').doc(context.auth.uid).get();
      const loyaltyData = loyaltyDoc.data();
      const washCount = loyaltyData?.washCount || 0;

      // Free wash available when washCount >= 6 (every 7th wash is free)
      if (washCount < 6) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Free wash not available. Current progress: ${washCount}/6 washes`
        );
      }

      freeWashApplied = true;
    }

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

    // Apply free wash - set base price to 0 (add-ons still apply)
    const finalBasePrice = freeWashApplied ? 0 : basePrice;
    const finalTotalPrice = freeWashApplied ? addOnsTotal : totalPrice;

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
      price: finalBasePrice,
      totalPrice: finalTotalPrice,
      originalPrice: basePrice, // Store original for reference
      addOnsPrice: addOnsTotal,
      isMonthlySubscription,
      usedFreeWash: freeWashApplied,
      status: isStaffOrder ? 'confirmed' : 'pending',
      paymentStatus: freeWashApplied && addOnsTotal === 0 ? 'free' : 'pending',
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

      // Consume free wash if used - reset washCount to 0
      if (freeWashApplied && context.auth?.uid) {
        await db.collection('loyalty').doc(context.auth.uid).update({
          washCount: 0,
          freeWashAvailable: false,
          lastFreeWashUsed: admin.firestore.FieldValue.serverTimestamp(),
          freeWashBookingId: docRef.id,
        });

        // Log free wash usage
        await db.collection('auditLog').add({
          action: 'free_wash_used',
          performedBy: context.auth.uid,
          performedByRole: 'customer',
          targetId: docRef.id,
          targetCollection: 'bookings',
          details: { packageId, vehicleType, originalPrice: basePrice },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(
          `Free wash redeemed by ${context.auth.uid} for booking ${docRef.id}`
        );
      }

      // Write audit log
      await db.collection('auditLog').add({
        action: isStaffOrder ? 'staff_order_created' : 'booking_created',
        performedBy: userId,
        performedByRole: isStaffOrder
          ? (context.auth?.token.role || 'staff')
          : 'customer',
        targetId: docRef.id,
        targetCollection: 'bookings',
        details: { 
          packageId, 
          vehicleType, 
          totalPrice: finalTotalPrice, 
          paymentMethod,
          freeWashUsed: freeWashApplied 
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `Booking ${docRef.id} created by ${userId} - ${packageId} - AED ${finalTotalPrice}${freeWashApplied ? ' (FREE WASH)' : ''}`
      );

      return {
        bookingId: docRef.id,
        calculatedPrice: finalTotalPrice,
        basePrice: finalBasePrice,
        originalPrice: basePrice,
        addOnsTotal,
        freeWashApplied,
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

// ============================================================
// Cloud Function: Send booking reminders (scheduled)
// Runs every hour, sends reminders for bookings in next 2 hours
// ============================================================

export const sendBookingReminders = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Dubai')
  .onRun(async () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.log('Telegram not configured, skipping reminders');
      return null;
    }

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    // Get today's date in YYYY-MM-DD format
    const todayStr = now.toISOString().split('T')[0];

    try {
      // Query bookings for today that haven't been reminded
      const bookingsSnapshot = await db
        .collection('bookings')
        .where('date', '==', todayStr)
        .where('status', 'in', ['pending', 'confirmed'])
        .where('reminderSent', '!=', true)
        .get();

      if (bookingsSnapshot.empty) {
        console.log('No bookings to remind');
        return null;
      }

      const currentHour = now.getHours();
      let remindersSent = 0;

      for (const doc of bookingsSnapshot.docs) {
        const booking = doc.data();
        const timeSlot = booking.time; // e.g., "14:00" or "15:00"

        if (!timeSlot) continue;

        // Parse booking hour
        const bookingHour = parseInt(timeSlot.split(':')[0], 10);

        // Check if booking is within 1-2 hours from now
        if (bookingHour >= currentHour + 1 && bookingHour <= currentHour + 2) {
          const customerPhone = booking.guestPhone || booking.userPhone || 'N/A';
          const customerName = booking.customerData?.name || booking.userName || 'Customer';
          const area = booking.location?.area || 'N/A';
          const villa = booking.location?.villa || '';

          const message = `⏰ <b>UPCOMING BOOKING REMINDER</b>\n\n` +
            `📋 Order #${doc.id.slice(-6).toUpperCase()}\n` +
            `👤 ${customerName}\n` +
            `📞 ${customerPhone}\n` +
            `🕐 Today at ${timeSlot}\n` +
            `📍 ${area}${villa ? `, Villa ${villa}` : ''}\n` +
            `🚗 ${booking.vehicleType || 'N/A'}\n` +
            `📦 ${booking.package || 'N/A'}\n\n` +
            `💰 AED ${booking.totalPrice || booking.price || 0}`;

          try {
            await sendTelegramMessage(botToken, chatId, message);

            // Mark as reminded
            await doc.ref.update({
              reminderSent: true,
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            remindersSent++;
            console.log(`Reminder sent for booking ${doc.id}`);
          } catch (error) {
            console.error(`Failed to send reminder for ${doc.id}:`, error);
          }
        }
      }

      console.log(`Sent ${remindersSent} booking reminders`);
      return { remindersSent };
    } catch (error) {
      console.error('Error in sendBookingReminders:', error);
      return null;
    }
  });

// ============================================================
// Cloud Function: Update loyalty count after completed booking
// ============================================================

export const updateLoyaltyOnCompletion = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when status changes to 'completed'
    if (before.status === after.status || after.status !== 'completed') {
      return null;
    }

    // Skip if free wash was used (already at 0)
    if (after.usedFreeWash) {
      console.log(`Skipping loyalty update for ${context.params.bookingId} - free wash was used`);
      return null;
    }

    const userId = after.userId;

    // Skip guest bookings (no loyalty tracking)
    if (!userId || userId === 'guest') {
      console.log(`Skipping loyalty update for ${context.params.bookingId} - guest booking`);
      return null;
    }

    try {
      const loyaltyRef = db.collection('loyalty').doc(userId);
      const loyaltyDoc = await loyaltyRef.get();

      if (!loyaltyDoc.exists) {
        // Create loyalty doc with count 1
        await loyaltyRef.set({
          washCount: 1,
          freeWashAvailable: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Increment wash count
        const currentCount = loyaltyDoc.data()?.washCount || 0;
        const newCount = currentCount + 1;

        await loyaltyRef.update({
          washCount: newCount,
          freeWashAvailable: newCount >= 6,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Notify if free wash earned
        if (newCount === 6) {
          console.log(`User ${userId} earned a free wash!`);

          // Could add push notification or email here
        }
      }

      console.log(`Loyalty updated for user ${userId} after booking ${context.params.bookingId}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating loyalty:', error);
      return null;
    }
  });

// ============================================================
// Status Update Notification Templates (Bilingual)
// ============================================================

interface StatusNotificationContent {
  subject: string;
  title: string;
  message: string;
  emoji: string;
  color: string;
}

const statusNotificationTranslations: Record<string, Record<string, StatusNotificationContent>> = {
  en: {
    confirmed: {
      subject: 'Booking Confirmed',
      title: 'Your Booking is Confirmed!',
      message: 'Great news! Your car wash booking has been confirmed. Our team will arrive at the scheduled time.',
      emoji: '✅',
      color: '#059669',
    },
    'in-progress': {
      subject: 'Service In Progress',
      title: 'Your Car Wash Has Started!',
      message: 'Our team has arrived and your car wash is now in progress. We\'ll notify you when it\'s complete.',
      emoji: '🚿',
      color: '#0284c7',
    },
    completed: {
      subject: 'Service Completed',
      title: 'Your Car Wash is Complete!',
      message: 'Your vehicle is now sparkling clean! Thank you for choosing 3ON. We hope to see you again soon.',
      emoji: '✨',
      color: '#7c3aed',
    },
    cancelled: {
      subject: 'Booking Cancelled',
      title: 'Booking Cancelled',
      message: 'Your car wash booking has been cancelled. If you have any questions, please contact us.',
      emoji: '❌',
      color: '#dc2626',
    },
  },
  ar: {
    confirmed: {
      subject: 'تم تأكيد الحجز',
      title: 'تم تأكيد حجزك!',
      message: 'أخبار رائعة! تم تأكيد حجز غسيل سيارتك. سيصل فريقنا في الوقت المحدد.',
      emoji: '✅',
      color: '#059669',
    },
    'in-progress': {
      subject: 'الخدمة قيد التنفيذ',
      title: 'بدأ غسيل سيارتك!',
      message: 'وصل فريقنا وغسيل سيارتك قيد التنفيذ الآن. سنبلغك عند الانتهاء.',
      emoji: '🚿',
      color: '#0284c7',
    },
    completed: {
      subject: 'اكتملت الخدمة',
      title: 'اكتمل غسيل سيارتك!',
      message: 'سيارتك الآن نظيفة ولامعة! شكراً لاختيارك 3ON. نأمل أن نراك مرة أخرى قريباً.',
      emoji: '✨',
      color: '#7c3aed',
    },
    cancelled: {
      subject: 'تم إلغاء الحجز',
      title: 'تم إلغاء الحجز',
      message: 'تم إلغاء حجز غسيل سيارتك. إذا كان لديك أي أسئلة، يرجى التواصل معنا.',
      emoji: '❌',
      color: '#dc2626',
    },
  },
};

const generateStatusUpdateEmail = (
  booking: BookingData,
  bookingId: string,
  newStatus: string,
  lang: 'en' | 'ar' = 'en'
): string => {
  const t = translations[lang];
  const statusContent = statusNotificationTranslations[lang][newStatus];
  const isRtl = lang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const packageNames: Record<string, Record<string, string>> = {
    en: { platinum: 'Platinum', titanium: 'Titanium', diamond: 'Diamond' },
    ar: { platinum: 'بلاتينيوم', titanium: 'تيتانيوم', diamond: 'دايموند' },
  };

  const packageName = packageNames[lang][booking.package || ''] || booking.package || 'N/A';

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; background: #f0f4f8; direction: ${dir}; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${statusContent.color} 0%, ${statusContent.color}cc 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }
    .header .emoji { font-size: 48px; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header .booking-id { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 25px; margin-top: 15px; font-weight: 600; letter-spacing: 1px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
    .message-box { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${statusContent.color}; text-align: ${isRtl ? 'right' : 'left'}; }
    .message-box p { margin: 0; color: #475569; font-size: 16px; }
    .section { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 13px; font-weight: 700; color: ${statusContent.color}; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid ${statusContent.color}; text-align: ${isRtl ? 'right' : 'left'}; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; flex-direction: ${isRtl ? 'row-reverse' : 'row'}; }
    .label { color: #64748b; font-size: 14px; }
    .value { font-weight: 600; color: #1e293b; font-size: 14px; }
    .footer { text-align: center; padding: 25px; color: #64748b; font-size: 12px; background: #f8fafc; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">${statusContent.emoji}</div>
      <h1>${statusContent.title}</h1>
      <div class="booking-id">#${bookingId.slice(-6).toUpperCase()}</div>
    </div>

    <div class="content">
      <div class="message-box">
        <p>${statusContent.message}</p>
      </div>

      <div class="section">
        <div class="section-title">${t.bookingDetails}</div>
        <div class="row">
          <span class="label">${t.bookingId}:</span>
          <span class="value">${bookingId.slice(-6).toUpperCase()}</span>
        </div>
        <div class="row">
          <span class="label">${t.date}:</span>
          <span class="value">${formatDate(booking.date)}</span>
        </div>
        <div class="row">
          <span class="label">${t.time}:</span>
          <span class="value">${booking.time || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">${t.package}:</span>
          <span class="value">${packageName}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${t.serviceLocation}</div>
        <div class="row">
          <span class="label">${t.area}:</span>
          <span class="value">${booking.location?.area || 'N/A'}</span>
        </div>
        ${booking.location?.villa ? `
        <div class="row">
          <span class="label">${t.villa}:</span>
          <span class="value">${booking.location.villa}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="footer">
      <p>🚗 ${t.footer}</p>
      <p>${t.automated}</p>
    </div>
  </div>
</body>
</html>
  `;
};

const generateStatusUpdateTelegramMessage = (
  booking: BookingData,
  bookingId: string,
  newStatus: string,
  lang: 'en' | 'ar' = 'en'
): string => {
  const statusContent = statusNotificationTranslations[lang][newStatus];

  const customerName = booking.customerData?.name || booking.userName || (lang === 'ar' ? 'عميل' : 'Customer');
  const area = booking.location?.area || 'N/A';
  const villa = booking.location?.villa || '';

  if (lang === 'ar') {
    return `${statusContent.emoji} <b>${statusContent.title}</b>\n\n` +
      `📋 رقم الحجز: #${bookingId.slice(-6).toUpperCase()}\n` +
      `👤 ${customerName}\n` +
      `📅 ${booking.date || 'N/A'} - ${booking.time || 'N/A'}\n` +
      `📍 ${area}${villa ? `، فيلا ${villa}` : ''}\n\n` +
      `${statusContent.message}\n\n` +
      `🚗 3ON لغسيل السيارات المتنقل`;
  }

  return `${statusContent.emoji} <b>${statusContent.title}</b>\n\n` +
    `📋 Booking: #${bookingId.slice(-6).toUpperCase()}\n` +
    `👤 ${customerName}\n` +
    `📅 ${booking.date || 'N/A'} - ${booking.time || 'N/A'}\n` +
    `📍 ${area}${villa ? `, Villa ${villa}` : ''}\n\n` +
    `${statusContent.message}\n\n` +
    `🚗 3ON Mobile Car Wash`;
};

// ============================================================
// Cloud Function: Send status update notifications
// Triggers when booking status changes to: confirmed, in-progress, completed, cancelled
// ============================================================

export const sendStatusUpdateNotification = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as BookingData;
    const after = change.after.data() as BookingData;
    const bookingId = context.params.bookingId;

    // Only trigger when status actually changes
    if (before.status === after.status) {
      return null;
    }

    const newStatus = after.status;

    // Only send notifications for these status values
    const notifiableStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];
    if (!newStatus || !notifiableStatuses.includes(newStatus)) {
      console.log(`Status '${newStatus}' is not notifiable. Skipping.`);
      return null;
    }

    // Determine language (default to English)
    const lang: 'en' | 'ar' = after.language === 'ar' ? 'ar' : 'en';

    const results: { email?: boolean; telegram?: boolean; errors?: string[] } = { errors: [] };

    // ---- Send Email Notification ----
    let customerEmail: string | null = null;

    // Try to get email from multiple sources
    if (after.customerEmail) {
      customerEmail = after.customerEmail;
    }
    const customerData = after.customerData as { email?: string } | undefined;
    if (!customerEmail && customerData?.email) {
      customerEmail = customerData.email;
    }
    if (!customerEmail && after.userId && after.userId !== 'guest') {
      try {
        const user = await admin.auth().getUser(after.userId as string);
        if (user.email) {
          customerEmail = user.email;
        }
      } catch (err) {
        console.log(`Could not fetch user ${after.userId}:`, err);
      }
    }

    if (customerEmail) {
      const smtpConfig = getSmtpConfig();

      if (smtpConfig.user && smtpConfig.password) {
        try {
          const transporter = createTransporter();
          const statusContent = statusNotificationTranslations[lang][newStatus];

          const subject = lang === 'ar'
            ? `${statusContent.subject} #${bookingId.slice(-6).toUpperCase()} - 3ON`
            : `${statusContent.subject} #${bookingId.slice(-6).toUpperCase()} - 3ON Car Wash`;

          const mailOptions = {
            from: `"3ON Car Wash" <${smtpConfig.user}>`,
            to: customerEmail,
            subject,
            html: generateStatusUpdateEmail(after, bookingId, newStatus, lang),
          };

          await transporter.sendMail(mailOptions);
          console.log(`Status update email sent to ${customerEmail} for ${bookingId} (${newStatus})`);
          results.email = true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error sending status update email:', error);
          results.errors?.push(`Email: ${errorMessage}`);
          results.email = false;
        }
      } else {
        console.log('SMTP not configured, skipping email notification');
      }
    } else {
      console.log(`No customer email for booking ${bookingId}`);
    }

    // ---- Send Telegram Notification to Customer ----
    // Check if booking has a customer Telegram chat ID
    const customerTelegramChatId = (after as Record<string, unknown>).telegramChatId as string | undefined;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (customerTelegramChatId && botToken) {
      try {
        const telegramMessage = generateStatusUpdateTelegramMessage(after, bookingId, newStatus, lang);
        await sendTelegramMessage(botToken, customerTelegramChatId, telegramMessage);
        console.log(`Status update Telegram sent to ${customerTelegramChatId} for ${bookingId} (${newStatus})`);
        results.telegram = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error sending status update Telegram:', error);
        results.errors?.push(`Telegram: ${errorMessage}`);
        results.telegram = false;
      }
    } else {
      console.log(`No Telegram chat ID for booking ${bookingId}`);
    }

    // Update booking with notification status
    await change.after.ref.update({
      [`statusNotification_${newStatus}`]: {
        emailSent: results.email ?? false,
        telegramSent: results.telegram ?? false,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        errors: results.errors?.length ? results.errors : null,
      },
    });

    return {
      success: true,
      bookingId,
      newStatus,
      email: results.email,
      telegram: results.telegram,
    };
  });
