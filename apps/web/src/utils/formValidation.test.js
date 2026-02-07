import { describe, it, expect } from 'vitest';
import {
  ValidationRules,
  validateField,
  validateForm,
  hasErrors,
  formatPhoneNumber,
  sanitizeInput,
  checkPasswordStrength,
  FormField
} from './formValidation';

describe('ValidationRules', () => {
  describe('required', () => {
    it('should return i18n key for empty string', () => {
      const result = ValidationRules.required('', 'Name');
      expect(result).toBe('validation.required');
    });

    it('should return i18n key for whitespace only', () => {
      const result = ValidationRules.required('   ', 'Email');
      expect(result).toBe('validation.required');
    });

    it('should return null for valid value', () => {
      const result = ValidationRules.required('Valid text');
      expect(result).toBeNull();
    });
  });

  describe('email', () => {
    it('should return null for valid email', () => {
      expect(ValidationRules.email('test@example.com')).toBeNull();
      expect(ValidationRules.email('user.name+tag@example.co.uk')).toBeNull();
    });

    it('should return error for invalid email', () => {
      expect(ValidationRules.email('invalid')).toBeTruthy();
      expect(ValidationRules.email('test@')).toBeTruthy();
      expect(ValidationRules.email('@example.com')).toBeTruthy();
      expect(ValidationRules.email('test@a.b')).toBeTruthy();
    });

    it('should return null for empty value', () => {
      expect(ValidationRules.email('')).toBeNull();
    });
  });

  describe('phone', () => {
    it('should return null for valid UAE phone', () => {
      expect(ValidationRules.phone('501234567')).toBeNull();
      expect(ValidationRules.phone('559876543')).toBeNull();
    });

    it('should return error for invalid length', () => {
      expect(ValidationRules.phone('50123456')).toBeTruthy(); // 8 digits
      expect(ValidationRules.phone('5012345678')).toBeTruthy(); // 10 digits
    });

    it('should return error if not starting with 5', () => {
      expect(ValidationRules.phone('401234567')).toBeTruthy();
    });

    it('should handle non-digit characters', () => {
      expect(ValidationRules.phone('50-123-4567')).toBeNull(); // Strips to 501234567
    });
  });

  describe('otp', () => {
    it('should return null for valid 6-digit OTP', () => {
      expect(ValidationRules.otp('123456')).toBeNull();
    });

    it('should return error for invalid length', () => {
      expect(ValidationRules.otp('12345')).toBeTruthy();
      expect(ValidationRules.otp('1234567')).toBeTruthy();
    });
  });

  describe('name', () => {
    it('should return null for valid names', () => {
      expect(ValidationRules.name('John Doe')).toBeNull();
      expect(ValidationRules.name('محمد')).toBeNull();
      expect(ValidationRules.name('Jean-Pierre')).toBeNull();
    });

    it('should return error for too short', () => {
      expect(ValidationRules.name('J')).toBeTruthy();
    });

    it('should return error for too long', () => {
      const longName = 'a'.repeat(101);
      expect(ValidationRules.name(longName)).toBeTruthy();
    });

    it('should return error for no letters', () => {
      expect(ValidationRules.name('123')).toBeTruthy();
    });
  });

  describe('minLength', () => {
    it('should return null for valid length', () => {
      const validator = ValidationRules.minLength(5);
      expect(validator('12345')).toBeNull();
      expect(validator('123456')).toBeNull();
    });

    it('should return error for too short', () => {
      const validator = ValidationRules.minLength(5);
      expect(validator('1234')).toBeTruthy();
    });
  });

  describe('maxLength', () => {
    it('should return null for valid length', () => {
      const validator = ValidationRules.maxLength(10);
      expect(validator('123')).toBeNull();
      expect(validator('1234567890')).toBeNull();
    });

    it('should return error for too long', () => {
      const validator = ValidationRules.maxLength(10);
      expect(validator('12345678901')).toBeTruthy();
    });
  });
});

describe('validateField', () => {
  it('should return null when all rules pass', () => {
    const rules = [ValidationRules.required, ValidationRules.email];
    const result = validateField('test@example.com', rules);
    expect(result).toBeNull();
  });

  it('should return first error when rules fail', () => {
    const rules = [ValidationRules.required, ValidationRules.email];
    const result = validateField('', rules);
    expect(result).toBeTruthy();
    expect(result).toContain('required');
  });

  it('should work with empty rules array', () => {
    const result = validateField('anything', []);
    expect(result).toBeNull();
  });
});

describe('validateForm', () => {
  it('should validate entire form', () => {
    const formData = {
      name: '',
      email: 'invalid-email'
    };

    const schema = {
      name: [ValidationRules.required],
      email: [ValidationRules.email]
    };

    const errors = validateForm(formData, schema);

    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
  });

  it('should return empty object for valid form', () => {
    const formData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const schema = {
      name: [ValidationRules.required, ValidationRules.name],
      email: [ValidationRules.email]
    };

    const errors = validateForm(formData, schema);

    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('hasErrors', () => {
  it('should return true for errors object with keys', () => {
    expect(hasErrors({ name: 'Required' })).toBe(true);
  });

  it('should return false for empty errors object', () => {
    expect(hasErrors({})).toBe(false);
  });
});

describe('formatPhoneNumber', () => {
  it('should format UAE phone numbers', () => {
    expect(formatPhoneNumber('501234567')).toBe('50 123 4567');
    expect(formatPhoneNumber('50')).toBe('50');
    expect(formatPhoneNumber('501')).toBe('50 1');
    expect(formatPhoneNumber('50123')).toBe('50 123');
  });

  it('should handle non-digit characters', () => {
    expect(formatPhoneNumber('50-123-4567')).toBe('50 123 4567');
  });
});

describe('sanitizeInput', () => {
  it('should sanitize HTML characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });

  it('should handle quotes and apostrophes', () => {
    expect(sanitizeInput('It\'s "quoted"'))
      .toBe('It&#x27;s &quot;quoted&quot;');
  });

  it('should return non-string values unchanged', () => {
    expect(sanitizeInput(123)).toBe(123);
    expect(sanitizeInput(null)).toBe(null);
  });
});

describe('checkPasswordStrength', () => {
  it('should return weak for short passwords', () => {
    const result = checkPasswordStrength('abc');
    expect(result.label).toBe('Weak');
    expect(result.color).toBe('red');
  });

  it('should return medium for moderate passwords', () => {
    const result = checkPasswordStrength('Password1');
    expect(result.label).toBe('Medium');
  });

  it('should return strong for complex passwords', () => {
    const result = checkPasswordStrength('P@ssw0rd123!');
    expect(result.label).toBe('Strong');
    expect(result.color).toBe('green');
  });

  it('should handle empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.strength).toBe(0);
    expect(result.label).toBe('None');
  });
});

describe('FormField', () => {
  it('should initialize with value', () => {
    const field = new FormField('initial');
    expect(field.value).toBe('initial');
    expect(field.error).toBeNull();
    expect(field.touched).toBe(false);
  });

  it('should set value', () => {
    const field = new FormField();
    field.setValue('new value');
    expect(field.value).toBe('new value');
  });

  it('should validate with rules', () => {
    const field = new FormField('');
    const isValid = field.validate([ValidationRules.required]);

    expect(isValid).toBe(false);
    expect(field.error).toBeTruthy();
  });

  it('should track touched state', () => {
    const field = new FormField();
    expect(field.touched).toBe(false);

    field.setTouched();
    expect(field.touched).toBe(true);
  });

  it('should reset field', () => {
    const field = new FormField('value');
    field.setError('Error');
    field.setTouched();

    field.reset();

    expect(field.value).toBe('');
    expect(field.error).toBeNull();
    expect(field.touched).toBe(false);
  });

  it('should check if valid', () => {
    const field = new FormField();
    expect(field.isValid).toBe(true);

    field.setError('Error');
    expect(field.isValid).toBe(false);
  });

  it('should determine when to show error', () => {
    const field = new FormField();
    field.setError('Error');

    expect(field.showError).toBe(false); // Not touched

    field.setTouched();
    expect(field.showError).toBe(true); // Touched with error
  });
});
