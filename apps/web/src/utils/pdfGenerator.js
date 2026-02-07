import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Enhanced PDF Receipt Generator for 3ON Mobile Carwash
 * Features:
 * - 3ON Logo at top
 * - QR code linking to booking tracking page
 * - Bilingual support (Arabic/English)
 * - Social media links
 * - Professional styling
 * - Thank you message
 * - Contact info footer
 */

// 3ON Logo as base64 (embedded for offline PDF generation)
// This is a simplified SVG-based logo representation
const LOGO_BASE64 = 'data:image/png;base64,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';

/**
 * Get translations for PDF content - bilingual support
 */
function getTranslations(language) {
  const translations = {
    en: {
      companyName: '3ON Mobile Carwash',
      tagline: 'We Come To You',
      title: 'BOOKING RECEIPT',
      bookingId: 'Booking ID',
      date: 'Date',
      time: 'Time',
      vehicle: 'Vehicle',
      package: 'Package',
      location: 'Location',
      payment: 'Payment Method',
      total: 'Total',
      thankYou: 'Thank you for choosing 3ON!',
      thankYouMessage: 'We appreciate your business and look forward to making your vehicle shine!',
      contact: 'Contact Us',
      phone: '+971 58 590 8876',
      email: 'info@3on.ae',
      website: 'www.3on.ae',
      cash: 'Cash',
      card: 'Card Payment',
      sedan: 'Sedan',
      suv: 'SUV',
      motorcycle: 'Motorcycle',
      caravan: 'Caravan',
      boat: 'Boat',
      platinum: 'Platinum',
      titanium: 'Titanium',
      diamond: 'Diamond',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      scanToTrack: 'Scan to track your booking',
      followUs: 'Follow Us',
      socialMedia: '@3oncarwash'
    },
    ar: {
      companyName: '3ON موبايل كارووش',
      tagline: 'نأتي إليك',
      title: 'إيصال الحجز',
      bookingId: 'رقم الحجز',
      date: 'التاريخ',
      time: 'الوقت',
      vehicle: 'المركبة',
      package: 'الباقة',
      location: 'الموقع',
      payment: 'طريقة الدفع',
      total: 'المجموع',
      thankYou: '!3ON شكراً لاختيارك',
      thankYouMessage: '!نقدر ثقتك بنا ونتطلع لجعل سيارتك تتألق',
      contact: 'تواصل معنا',
      phone: '+971 58 590 8876',
      email: 'info@3on.ae',
      website: 'www.3on.ae',
      cash: 'نقداً',
      card: 'بطاقة ائتمان',
      sedan: 'سيدان',
      suv: 'جيب/SUV',
      motorcycle: 'دراجة نارية',
      caravan: 'كرفان',
      boat: 'قارب',
      platinum: 'بلاتينيوم',
      titanium: 'تيتانيوم',
      diamond: 'دايموند',
      small: 'صغير',
      medium: 'متوسط',
      large: 'كبير',
      scanToTrack: 'امسح لتتبع حجزك',
      followUs: 'تابعنا',
      socialMedia: '@3oncarwash'
    }
  };
  return translations[language] || translations.en;
}

/**
 * Format date based on language
 */
function formatDate(dateStr, language) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return formatted;
}

/**
 * Format time to 12-hour format
 */
function formatTime(time) {
  if (!time || typeof time !== 'string') return '-';
  const parts = time.split(':');
  if (parts.length < 2) return time;
  const [hours, minutes] = parts;
  const hour = parseInt(hours, 10);
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes || '00'} ${ampm}`;
}

/**
 * Generate QR code as data URL - links to booking tracking page
 */
async function generateQRCode(bookingId) {
  try {
    // Generate QR code that links to the booking tracking page
    const trackingUrl = `${window.location.origin}/track?booking=${bookingId}`;
    const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
}

/**
 * Get vehicle type translation
 */
function getVehicleTypeName(vehicleType, size, t) {
  const typeName = t[vehicleType] || vehicleType;
  if (size) {
    const sizeName = t[size] || size;
    return `${typeName} (${sizeName})`;
  }
  return typeName;
}

/**
 * Get package name translation
 */
function getPackageName(packageType, t) {
  return t[packageType] || packageType;
}

/**
 * Get payment method translation
 */
function getPaymentMethod(method, t) {
  if (method === 'cash') return t.cash;
  return t.card;
}

/**
 * Generate enhanced PDF receipt
 * @param {Object} options - Receipt options
 * @param {string} options.bookingId - Booking ID
 * @param {Object} options.booking - Booking data
 * @param {string} options.language - Language code ('en' or 'ar')
 * @returns {Promise<jsPDF>} - jsPDF instance
 */
export async function generateReceiptPDF({ bookingId, booking, language = 'en' }) {
  const isRTL = language === 'ar';
  const t = getTranslations(language);
  
  // Create PDF with custom receipt size
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 200] // Custom receipt size - slightly taller for more content
  });

  const pageWidth = 100;
  const margin = 8;
  const contentWidth = pageWidth - (margin * 2);
  let y = 8;

  // Colors
  const primaryColor = [26, 26, 46]; // #1a1a2e - Dark navy
  const accentColor = [22, 163, 74]; // #16a34a - Success green
  const grayColor = [107, 114, 128]; // #6b7280
  const lightGray = [229, 231, 235]; // #e5e7eb
  const brandBlue = [59, 130, 246]; // #3b82f6

  // Helper for row with label and value
  const drawRow = (label, value) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (isRTL) {
      doc.setTextColor(...grayColor);
      doc.text(label, pageWidth - margin, y, { align: 'right' });
      doc.setTextColor(...primaryColor);
      doc.text(String(value), margin, y, { align: 'left' });
    } else {
      doc.setTextColor(...grayColor);
      doc.text(label, margin, y, { align: 'left' });
      doc.setTextColor(...primaryColor);
      doc.text(String(value), pageWidth - margin, y, { align: 'right' });
    }
    y += 6;
  };

  // Draw dashed line
  const drawDashedLine = () => {
    doc.setDrawColor(...lightGray);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0);
    y += 4;
  };

  // Draw solid line
  const drawSolidLine = () => {
    doc.setDrawColor(...lightGray);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // === HEADER WITH LOGO ===
  try {
    // Add 3ON logo
    const logoSize = 20;
    const logoX = (pageWidth - logoSize) / 2;
    doc.addImage(LOGO_BASE64, 'PNG', logoX, y, logoSize, logoSize);
    y += logoSize + 4;
  } catch (error) {
    // Fallback: emoji icon if logo fails
    doc.setFontSize(24);
    doc.text('🚐', pageWidth / 2, y + 8, { align: 'center' });
    y += 14;
  }

  // Company Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(t.companyName, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(t.tagline, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Receipt Title with decorative lines
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 15, y);
  doc.line(pageWidth - margin - 15, y, pageWidth - margin, y);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text(t.title, pageWidth / 2, y + 0.5, { align: 'center' });
  y += 6;

  // === BOOKING ID SECTION ===
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y - 2, contentWidth, 11, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  const idLabelX = isRTL ? pageWidth - margin - 4 : margin + 4;
  doc.text(t.bookingId, idLabelX, y + 4, { align: isRTL ? 'right' : 'left' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  const idValueX = isRTL ? margin + 4 : pageWidth - margin - 4;
  doc.text(`#${bookingId}`, idValueX, y + 4, { align: isRTL ? 'left' : 'right' });
  y += 14;

  // === DIVIDER ===
  drawDashedLine();

  // === BOOKING DETAILS ===
  // Date
  drawRow(t.date, formatDate(booking.date, language));
  
  // Time
  drawRow(t.time, formatTime(booking.time));
  
  // Vehicle
  const vehicleName = getVehicleTypeName(booking.vehicleType, booking.vehicleSize, t);
  drawRow(t.vehicle, vehicleName);
  
  // Package
  const packageName = getPackageName(booking.package, t);
  drawRow(t.package, packageName);
  
  // Location
  let location = booking.area || '';
  if (booking.villa) {
    location += location ? `, ${booking.villa}` : booking.villa;
  }
  drawRow(t.location, location || '-');
  
  // Payment
  const paymentMethod = getPaymentMethod(booking.paymentMethod, t);
  drawRow(t.payment, paymentMethod);

  // === DIVIDER ===
  drawDashedLine();

  // === TOTAL SECTION ===
  doc.setFillColor(22, 163, 74, 0.1); // Light green background
  doc.roundedRect(margin, y - 2, contentWidth, 12, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  if (isRTL) {
    doc.setTextColor(...primaryColor);
    doc.text(t.total, pageWidth - margin - 4, y + 4, { align: 'right' });
    doc.setTextColor(...accentColor);
    doc.text(`AED ${booking.price || '-'}`, margin + 4, y + 4, { align: 'left' });
  } else {
    doc.setTextColor(...primaryColor);
    doc.text(t.total, margin + 4, y + 4, { align: 'left' });
    doc.setTextColor(...accentColor);
    doc.text(`AED ${booking.price || '-'}`, pageWidth - margin - 4, y + 4, { align: 'right' });
  }
  y += 16;

  // === QR CODE SECTION ===
  const qrCodeDataUrl = await generateQRCode(bookingId);
  if (qrCodeDataUrl) {
    // QR Code label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(t.scanToTrack, pageWidth / 2, y, { align: 'center' });
    y += 4;

    // QR Code
    const qrSize = 28;
    const qrX = (pageWidth - qrSize) / 2;
    
    // Add subtle border around QR
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX - 2, y - 1, qrSize + 4, qrSize + 4, 1, 1, 'S');
    
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, y, qrSize, qrSize);
    y += qrSize + 6;
  }

  // === THANK YOU MESSAGE ===
  drawSolidLine();
  
  // Thank you header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(t.thankYou, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Thank you message
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  
  // Split long message into lines
  const thankYouLines = doc.splitTextToSize(t.thankYouMessage, contentWidth - 4);
  thankYouLines.forEach(line => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 3.5;
  });
  y += 2;

  // === CONTACT INFO FOOTER ===
  drawDashedLine();
  
  // Contact header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(t.contact, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Contact details
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  
  // Phone icon + number
  doc.text(`📞 ${t.phone}`, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  
  // Email
  doc.text(`✉️ ${t.email}`, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  
  // Website
  doc.setTextColor(...brandBlue);
  doc.text(`🌐 ${t.website}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // === SOCIAL MEDIA ===
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(t.followUs, pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  // Social media icons and handle
  doc.setTextColor(...brandBlue);
  doc.text(`📱 Instagram • Facebook • TikTok`, pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.text(t.socialMedia, pageWidth / 2, y, { align: 'center' });

  return doc;
}

/**
 * Download PDF receipt
 */
export async function downloadReceiptPDF({ bookingId, booking, language = 'en' }) {
  try {
    const doc = await generateReceiptPDF({ bookingId, booking, language });
    const filename = `3ON-Receipt-${bookingId}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}

export default {
  generateReceiptPDF,
  downloadReceiptPDF
};
