import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),

  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .optional()
    .or(z.literal('')),

  role: z.enum(['customer', 'staff', 'admin'], {
    errorMap: () => ({ message: 'Role must be customer, staff, or admin' })
  }).optional(),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional()
    .or(z.literal(''))
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = userSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Booking schemas
export const bookingSchema = z.object({
  service_id: z.number().positive('Please select a service'),

  vehicle_id: z.number().positive('Please select a vehicle').optional(),

  scheduled_time: z.string()
    .min(1, 'Please select a date and time')
    .refine((val) => {
      const date = new Date(val);
      return date > new Date();
    }, 'Scheduled time must be in the future'),

  location: z.string()
    .min(2, 'Location must be at least 2 characters')
    .max(200, 'Location must be less than 200 characters'),

  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

// Service schemas
export const serviceSchema = z.object({
  name: z.string()
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must be less than 100 characters'),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),

  price: z.number()
    .positive('Price must be greater than 0')
    .max(10000, 'Price must be less than 10,000'),

  duration: z.number()
    .int('Duration must be a whole number')
    .positive('Duration must be greater than 0')
    .max(480, 'Duration must be less than 480 minutes (8 hours)'),

  is_active: z.boolean().optional()
});

// Vehicle schemas
export const vehicleSchema = z.object({
  make: z.string()
    .min(2, 'Make must be at least 2 characters')
    .max(50, 'Make must be less than 50 characters'),

  model: z.string()
    .min(1, 'Model must be at least 1 character')
    .max(50, 'Model must be less than 50 characters'),

  year: z.number()
    .int('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),

  license_plate: z.string()
    .min(2, 'License plate must be at least 2 characters')
    .max(20, 'License plate must be less than 20 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid license plate format'),

  color: z.string()
    .min(2, 'Color must be at least 2 characters')
    .max(30, 'Color must be less than 30 characters')
    .optional()
    .or(z.literal(''))
});

// Payment schemas
export const paymentSchema = z.object({
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(100000, 'Amount must be less than 100,000'),

  payment_method: z.enum(['cash', 'card', 'online'], {
    errorMap: () => ({ message: 'Please select a valid payment method' })
  }),

  transaction_id: z.string()
    .max(100, 'Transaction ID must be less than 100 characters')
    .optional()
    .or(z.literal(''))
});

// Settings schemas
export const profileSettingsSchema = z.object({
  name: userSchema.shape.name,
  email: userSchema.shape.email,
  phone: userSchema.shape.phone,
  notifications_enabled: z.boolean().optional(),
  language: z.enum(['en', 'ar']).optional()
});

export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),

  new_password: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

// Helper function to validate data
export const validateData = (schema, data) => {
  try {
    return {
      success: true,
      data: schema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });

      return {
        success: false,
        data: null,
        errors
      };
    }

    return {
      success: false,
      data: null,
      errors: { _general: 'Validation failed' }
    };
  }
};
