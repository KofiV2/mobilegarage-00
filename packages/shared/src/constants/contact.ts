/**
 * Contact and communication constants
 * Shared across web and mobile apps
 */

/**
 * WhatsApp contact number (with country code, no + prefix)
 * Default: 3ON UAE support number
 */
export const WHATSAPP_NUMBER = '9710554995611';

/**
 * Build a WhatsApp URL with optional pre-filled message
 */
export const getWhatsAppUrl = (message?: string): string => {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
};

/**
 * Build a WhatsApp booking message
 */
export const getBookingWhatsAppMessage = (
  packageName: string,
  vehicleType: string,
  price: number,
  language: 'en' | 'ar' = 'en'
): string => {
  if (language === 'ar') {
    return `مرحباً! أود حجز باقة ${packageName} لسيارتي (${vehicleType}) - ${price} درهم`;
  }
  return `Hi! I'd like to book the ${packageName} package for my ${vehicleType} - AED ${price}`;
};

/**
 * Build a generic WhatsApp inquiry message
 */
export const getInquiryWhatsAppMessage = (language: 'en' | 'ar' = 'en'): string => {
  if (language === 'ar') {
    return 'مرحباً! أود حجز خدمة غسيل سيارات';
  }
  return 'Hi! I would like to book a car wash service';
};

export default WHATSAPP_NUMBER;
