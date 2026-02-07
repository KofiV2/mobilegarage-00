/**
 * Form Validation Utilities
 *
 * Comprehensive validation functions for forms in the application.
 * Provides real-time validation, field-level errors, and accessibility support.
 * Supports bilingual error messages (English/Arabic) via i18n keys.
 */

/**
 * Normalize phone number - strips country code and non-digits
 * Accepts: +971501234567, 971501234567, 0501234567, 501234567
 * Returns: 9-digit number starting with 5
 */
export function normalizePhoneNumber(value) {
  if (!value) return '';
  
  let digits = value.replace(/\D/g, '');
  
  // Remove UAE country code if present
  if (digits.startsWith('971')) {
    digits = digits.slice(3);
  }
  
  // Remove leading zero if present
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  
  return digits;
}

/**
 * Validation Rules - All return i18n keys for bilingual support
 */
export const ValidationRules = {
  // Required field
  required: (value, fieldName = 'This field') => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (!trimmed || trimmed.length === 0) {
      return 'validation.required';
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value) return null; // Skip if empty (use required separately)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'validation.invalidEmail';
    }

    // Additional checks
    const parts = value.split('@');
    const domain = parts[1];
    if (domain.length < 4) {
      return 'validation.invalidEmail';
    }

    // Check TLD is at least 2 characters
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return 'validation.invalidEmail';
    }

    return null;
  },

  // Phone number validation (UAE format) - flexible to accept various formats
  phone: (value) => {
    if (!value) return null;

    const digits = normalizePhoneNumber(value);

    // UAE mobile: 9 digits starting with 5
    if (digits.length !== 9) {
      return 'validation.phoneLength';
    }

    if (!digits.startsWith('5')) {
      return 'validation.phoneStartsWith5';
    }

    return null;
  },

  // OTP validation
  otp: (value) => {
    if (!value) return null;

    const digits = value.replace(/\D/g, '');

    if (digits.length !== 6) {
      return 'validation.otpLength';
    }

    return null;
  },

  // Name validation
  name: (value) => {
    if (!value) return null;

    const trimmed = value.trim();

    if (trimmed.length < 2) {
      return 'validation.nameMinLength';
    }

    if (trimmed.length > 100) {
      return 'validation.nameMaxLength';
    }

    // Check for at least one letter (supports Latin, Arabic, and other Unicode letters)
    if (!/\p{L}/u.test(trimmed)) {
      return 'validation.nameRequireLetter';
    }

    return null;
  },

  // Min length
  minLength: (min) => (value) => {
    if (!value) return null;

    if (value.length < min) {
      return { key: 'validation.minLength', params: { min } };
    }

    return null;
  },

  // Max length
  maxLength: (max) => (value) => {
    if (!value) return null;

    if (value.length > max) {
      return { key: 'validation.maxLength', params: { max } };
    }

    return null;
  },

  // Pattern matching
  pattern: (regex, messageKey = 'validation.invalidFormat') => (value) => {
    if (!value) return null;

    if (!regex.test(value)) {
      return messageKey;
    }

    return null;
  },

  // Custom validation
  custom: (validatorFn) => (value) => {
    return validatorFn(value);
  }
};

/**
 * Validate a single field
 * @param {*} value - Field value
 * @param {Array} rules - Array of validation rules
 * @returns {string|object|null} Error key/object or null
 */
export function validateField(value, rules = []) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Validate entire form
 * @param {Object} formData - Form data object
 * @param {Object} validationSchema - Validation schema
 * @returns {Object} Errors object with field names as keys
 */
export function validateForm(formData, validationSchema) {
  const errors = {};

  Object.keys(validationSchema).forEach(fieldName => {
    const rules = validationSchema[fieldName];
    const value = formData[fieldName];
    const error = validateField(value, rules);

    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
}

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean}
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * Get first error field name for auto-focus
 * @param {Object} errors - Errors object
 * @param {Array} fieldOrder - Optional array of field names in order
 * @returns {string|null} First error field name
 */
export function getFirstErrorField(errors, fieldOrder = null) {
  if (!hasErrors(errors)) return null;
  
  if (fieldOrder) {
    for (const field of fieldOrder) {
      if (errors[field]) return field;
    }
  }
  
  return Object.keys(errors)[0];
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // Auth - Phone step
  phone: {
    phoneNumber: [ValidationRules.required, ValidationRules.phone]
  },

  // Auth - OTP step
  otp: {
    otp: [ValidationRules.required, ValidationRules.otp]
  },

  // Edit Profile
  profile: {
    name: [ValidationRules.required, ValidationRules.name],
    email: [ValidationRules.email] // Optional, only validated if provided
  },

  // Contact form
  contact: {
    name: [ValidationRules.required, ValidationRules.name],
    email: [ValidationRules.required, ValidationRules.email],
    message: [
      ValidationRules.required,
      ValidationRules.minLength(10),
      ValidationRules.maxLength(1000)
    ]
  }
};

/**
 * Format phone number for display
 * @param {string} value - Raw phone input
 * @returns {string} Formatted phone
 */
export function formatPhoneNumber(value) {
  const digits = normalizePhoneNumber(value);

  // Format as: 5X XXX XXXX
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 5) {
    return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  }
}

/**
 * Sanitize input to prevent XSS
 * @param {string} value - Input value
 * @returns {string} Sanitized value
 */
export function sanitizeInput(value) {
  if (typeof value !== 'string') return value;

  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Debounce validation for real-time feedback
 * @param {Function} validationFn - Validation function
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced validation function
 */
export function debounceValidation(validationFn, delay = 300) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);

    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(validationFn(...args));
      }, delay);
    });
  };
}

/**
 * Get field validation state for accessibility
 * @param {string} error - Error message
 * @param {boolean} touched - Whether field has been touched
 * @returns {Object} ARIA attributes
 */
export function getFieldAriaProps(error, touched = true) {
  if (!touched) {
    return {};
  }

  return {
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': error ? 'field-error' : undefined
  };
}

/**
 * Password strength checker
 * @param {string} password - Password to check
 * @returns {Object} Strength info
 */
export function checkPasswordStrength(password) {
  if (!password) {
    return { strength: 0, label: 'None', color: 'gray' };
  }

  let strength = 0;

  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character types
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  // Map strength to label and color
  if (strength <= 2) {
    return { strength, label: 'Weak', color: 'red' };
  } else if (strength <= 4) {
    return { strength, label: 'Medium', color: 'orange' };
  } else {
    return { strength, label: 'Strong', color: 'green' };
  }
}

/**
 * Form field helper
 */
export class FormField {
  constructor(initialValue = '') {
    this.value = initialValue;
    this.error = null;
    this.touched = false;
  }

  setValue(value) {
    this.value = value;
    return this;
  }

  setError(error) {
    this.error = error;
    return this;
  }

  setTouched(touched = true) {
    this.touched = touched;
    return this;
  }

  validate(rules) {
    this.error = validateField(this.value, rules);
    return this.error === null;
  }

  reset() {
    this.value = '';
    this.error = null;
    this.touched = false;
    return this;
  }

  get isValid() {
    return this.error === null;
  }

  get showError() {
    return this.touched && this.error !== null;
  }
}

/**
 * Export all utilities
 */
export default {
  ValidationRules,
  ValidationSchemas,
  validateField,
  validateForm,
  hasErrors,
  getFirstErrorField,
  formatPhoneNumber,
  normalizePhoneNumber,
  sanitizeInput,
  debounceValidation,
  getFieldAriaProps,
  checkPasswordStrength,
  FormField
};
