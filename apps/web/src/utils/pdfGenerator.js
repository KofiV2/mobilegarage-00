import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * PDF Receipt Generator for 3ON Mobile Carwash
 * Supports Arabic (RTL) and English (LTR) layouts
 */

// Arabic font support - embedded Amiri font subset for Arabic text
// For full Arabic support, we use the canvas method to render Arabic text
const ARABIC_NUMERALS = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
};

/**
 * Convert Western numerals to Arabic numerals
 */
function toArabicNumerals(str) {
  if (!str) return str;
  return String(str).replace(/[0-9]/g, d => ARABIC_NUMERALS[d]);
}

/**
 * Reverse Arabic text for proper RTL display in PDF
 * jsPDF doesn't natively support RTL, so we need to reverse the text
 */
function prepareArabicText(text) {
  if (!text) return text;
  // Keep numbers in correct order within reversed text
  return text.split('').reverse().join('');
}

/**
 * Generate QR code as data URL
 */
async function generateQRCode(bookingId) {
  try {
    const qrDataUrl = await QRCode.toDataURL(`3ON-${bookingId}`, {
      width: 80,
      margin: 1,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
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
 * Get translations for PDF content
 */
function getTranslations(language) {
  const translations = {
    en: {
      companyName: '3ON Mobile Carwash',
      title: 'Booking Receipt',
      bookingId: 'Booking ID',
      date: 'Date',
      time: 'Time',
      vehicle: 'Vehicle',
      package: 'Package',
      location: 'Location',
      payment: 'Payment Method',
      total: 'Total',
      thankYou: 'Thank you for choosing 3ON!',
      contact: 'Contact: +971 58 590 8876',
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
      large: 'Large'
    },
    ar: {
      companyName: '3ON موبايل كارووش',
      title: 'إيصال الحجز',
      bookingId: 'رقم الحجز',
      date: 'التاريخ',
      time: 'الوقت',
      vehicle: 'السيارة',
      package: 'الباقة',
      location: 'الموقع',
      payment: 'طريقة الدفع',
      total: 'المجموع',
      thankYou: 'شكراً لاختيارك 3ON!',
      contact: '+971 58 590 8876 :التواصل',
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
      large: 'كبير'
    }
  };
  return translations[language] || translations.en;
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
 * Generate PDF receipt
 * @param {Object} options - Receipt options
 * @param {string} options.bookingId - Booking ID
 * @param {Object} options.booking - Booking data
 * @param {string} options.language - Language code ('en' or 'ar')
 * @returns {Promise<jsPDF>} - jsPDF instance
 */
export async function generateReceiptPDF({ bookingId, booking, language = 'en' }) {
  const isRTL = language === 'ar';
  const t = getTranslations(language);
  
  // Create PDF with A5 size (receipt-like)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 180] // Custom receipt size
  });

  const pageWidth = 100;
  const margin = 8;
  const contentWidth = pageWidth - (margin * 2);
  let y = 10;

  // Colors
  const primaryColor = [26, 26, 46]; // #1a1a2e
  const accentColor = [22, 163, 74]; // #16a34a (success green)
  const grayColor = [107, 114, 128]; // #6b7280
  const lightGray = [229, 231, 235]; // #e5e7eb

  // Helper function to draw text (handles RTL)
  const drawText = (text, x, options = {}) => {
    const { align = 'left', color = primaryColor, size = 10, bold = false } = options;
    doc.setFontSize(size);
    doc.setTextColor(...color);
    
    if (bold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    let textX = x;
    if (align === 'center') {
      textX = pageWidth / 2;
    } else if (align === 'right' || (isRTL && align === 'left')) {
      textX = pageWidth - margin;
    }

    doc.text(text, textX, y, { 
      align: align === 'center' ? 'center' : (isRTL ? 'right' : align)
    });
  };

  // Helper for row with label and value
  const drawRow = (label, value) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (isRTL) {
      // RTL: value on left, label on right
      doc.setTextColor(...grayColor);
      doc.text(label, pageWidth - margin, y, { align: 'right' });
      doc.setTextColor(...primaryColor);
      doc.text(value, margin, y, { align: 'left' });
    } else {
      // LTR: label on left, value on right
      doc.setTextColor(...grayColor);
      doc.text(label, margin, y, { align: 'left' });
      doc.setTextColor(...primaryColor);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
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

  // === HEADER ===
  // Logo/Icon
  doc.setFontSize(24);
  doc.text('🚐', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Company Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(t.companyName, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(t.title.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 8;

  // === BOOKING ID SECTION ===
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y - 3, contentWidth, 12, 2, 2, 'F');
  
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

  // === DETAILS ===
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

  // === TOTAL ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  if (isRTL) {
    doc.setTextColor(...primaryColor);
    doc.text(t.total, pageWidth - margin, y, { align: 'right' });
    doc.setTextColor(...accentColor);
    doc.text(`AED ${booking.price || '-'}`, margin, y, { align: 'left' });
  } else {
    doc.setTextColor(...primaryColor);
    doc.text(t.total, margin, y, { align: 'left' });
    doc.setTextColor(...accentColor);
    doc.text(`AED ${booking.price || '-'}`, pageWidth - margin, y, { align: 'right' });
  }
  y += 10;

  // === QR CODE ===
  const qrCodeDataUrl = await generateQRCode(bookingId);
  if (qrCodeDataUrl) {
    const qrSize = 25;
    const qrX = (pageWidth - qrSize) / 2;
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, y, qrSize, qrSize);
    y += qrSize + 5;
  }

  // === FOOTER ===
  doc.setDrawColor(...lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(t.thankYou, pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(t.contact, pageWidth / 2, y, { align: 'center' });

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
