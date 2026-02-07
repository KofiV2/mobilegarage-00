/**
 * Validation utilities
 * Shared across web and mobile platforms
 */

type ValidationRule = (value: string) => string | null;

/**
 * Validation Rules
 */
export const ValidationRules = {
  required: (value: string, fieldName: string = 'This field'): string | null => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (!trimmed || trimmed.length === 0) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    const parts = value.split('@');
    if (parts[1].length < 3) {
      return 'Email domain is too short';
    }
    return null;
  },

  phone: (value: string): string | null => {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 9) {
      return 'Phone number must be 9 digits';
    }
    if (!digits.startsWith('5')) {
      return 'UAE mobile numbers start with 5';
    }
    return null;
  },

  otp: (value: string): string | null => {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 6) {
      return 'OTP must be 6 digits';
    }
    return null;
  },

  name: (value: string): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (trimmed.length > 100) {
      return 'Name is too long (max 100 characters)';
    }
    if (!/[a-zA-Z]/.test(trimmed)) {
      return 'Name must contain at least one letter';
    }
    return null;
  },

  minLength:
    (min: number): ValidationRule =>
    (value: string): string | null => {
      if (!value) return null;
      if (value.length < min) {
        return `Must be at least ${min} characters`;
      }
      return null;
    },

  maxLength:
    (max: number): ValidationRule =>
    (value: string): string | null => {
      if (!value) return null;
      if (value.length > max) {
        return `Must be no more than ${max} characters`;
      }
      return null;
    },

  pattern:
    (regex: RegExp, message?: string): ValidationRule =>
    (value: string): string | null => {
      if (!value) return null;
      if (!regex.test(value)) {
        return message || 'Invalid format';
      }
      return null;
    },

  custom:
    (validatorFn: (value: string) => string | null): ValidationRule =>
    (value: string): string | null => {
      return validatorFn(value);
    },
};

/**
 * Validate a single field
 */
export function validateField(
  value: string,
  rules: ValidationRule[] = []
): string | null {
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
 */
export function validateForm(
  formData: Record<string, string>,
  validationSchema: Record<string, ValidationRule[]>
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(validationSchema).forEach((fieldName) => {
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
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  phone: {
    phoneNumber: [
      (v: string) => ValidationRules.required(v, 'Phone number'),
      ValidationRules.phone,
    ],
  },
  otp: {
    otp: [
      (v: string) => ValidationRules.required(v, 'Verification code'),
      ValidationRules.otp,
    ],
  },
  profile: {
    name: [
      (v: string) => ValidationRules.required(v, 'Name'),
      ValidationRules.name,
    ],
    email: [ValidationRules.email],
  },
  contact: {
    name: [
      (v: string) => ValidationRules.required(v, 'Name'),
      ValidationRules.name,
    ],
    email: [
      (v: string) => ValidationRules.required(v, 'Email'),
      ValidationRules.email,
    ],
    message: [
      (v: string) => ValidationRules.required(v, 'Message'),
      ValidationRules.minLength(10),
      ValidationRules.maxLength(1000),
    ],
  },
};

/**
 * Format phone number for display
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
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
 */
export function sanitizeInput(value: unknown): string {
  if (typeof value !== 'string') return String(value ?? '');
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Escapes HTML special characters
 */
export const escapeHtml = (str: unknown): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates phone number format (UAE and international)
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, '');
  return /^(\+?971|0)?5[0-9]{8}$/.test(cleaned) || /^[0-9]{9,15}$/.test(cleaned);
};

/**
 * Sanitizes phone number for use in tel: URI
 */
export const sanitizePhoneUri = (phone: string): string | null => {
  if (!phone) return null;
  const sanitized = String(phone).replace(/[^0-9+]/g, '');
  if (!isValidPhone(sanitized)) return null;
  return sanitized;
};

/**
 * Strips HTML tags from a string
 */
export const stripHtml = (str: string): string => {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '');
};

/**
 * Sanitizes a URL to prevent javascript: and data: URI attacks
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  const trimmed = String(url).trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return null;
  }
  return url;
};

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
  strength: number;
  label: string;
  color: string;
} {
  if (!password) {
    return { strength: 0, label: 'None', color: 'gray' };
  }

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 2) {
    return { strength, label: 'Weak', color: 'red' };
  } else if (strength <= 4) {
    return { strength, label: 'Medium', color: 'orange' };
  } else {
    return { strength, label: 'Strong', color: 'green' };
  }
}

/**
 * Debounce validation for real-time feedback
 */
export function debounceValidation(
  validationFn: (...args: unknown[]) => unknown,
  delay: number = 300
): (...args: unknown[]) => Promise<unknown> {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: unknown[]) => {
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
 */
export function getFieldAriaProps(
  error: string | null,
  touched: boolean = true
): Record<string, string | undefined> {
  if (!touched) {
    return {};
  }
  return {
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': error ? 'field-error' : undefined,
  };
}
