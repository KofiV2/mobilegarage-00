/**
 * Analytics and Conversion Tracking Utilities
 */

/**
 * Track a Google Ads conversion event
 * @param {string} transactionId - Unique transaction/booking ID
 * @param {number} value - Transaction value in AED (optional)
 * @param {boolean} isNewCustomer - Whether this is a new customer (optional)
 */
export const trackPurchaseConversion = (transactionId, value = null, isNewCustomer = null) => {
  // Check if gtag is available
  if (typeof window.gtag !== 'function') {
    console.warn('Google Analytics not loaded, skipping conversion tracking');
    return;
  }

  try {
    const conversionData = {
      'send_to': 'AW-17916554742/Ydc2CNem8fIbEPbbo99C',
      'transaction_id': transactionId || ''
    };

    // Add optional value if provided
    if (value !== null) {
      conversionData['value'] = value;
      conversionData['currency'] = 'AED';
    }

    // Add new customer flag if provided
    if (isNewCustomer !== null) {
      conversionData['new_customer'] = isNewCustomer;
    }

    window.gtag('event', 'conversion', conversionData);
    console.log('Google Ads conversion tracked:', transactionId);
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
};

/**
 * Track a page view event
 * @param {string} pagePath - The page path
 * @param {string} pageTitle - The page title
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (typeof window.gtag !== 'function') {
    return;
  }

  try {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {object} params - Event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag !== 'function') {
    return;
  }

  try {
    window.gtag('event', eventName, params);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

export default {
  trackPurchaseConversion,
  trackPageView,
  trackEvent
};
