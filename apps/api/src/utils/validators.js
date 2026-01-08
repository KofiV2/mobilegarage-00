const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common validation rules
const validators = {
  // Email validation
  email: body('email')
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  // Password validation
  password: body('password')
    .trim()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
    .not().isEmpty().withMessage('Password is required'),

  // Simple password (for login, less strict)
  simplePassword: body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),

  // Name validation
  firstName: body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('First name can only contain letters'),

  lastName: body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Last name can only contain letters'),

  // Phone validation
  phone: body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Must be a valid phone number'),

  // MongoDB ObjectId validation
  objectId: (fieldName) => param(fieldName)
    .trim()
    .matches(/^[a-f\d]{24}$/i).withMessage('Invalid ID format'),

  // UUID validation
  uuid: (fieldName) => param(fieldName)
    .trim()
    .isUUID().withMessage('Invalid UUID format'),

  // Date validation
  date: (fieldName) => body(fieldName)
    .trim()
    .isISO8601().withMessage('Must be a valid date')
    .toDate(),

  // Number validation
  number: (fieldName, min = 0, max = null) => {
    let validator = body(fieldName)
      .trim()
      .isNumeric().withMessage(`${fieldName} must be a number`)
      .toFloat();

    if (min !== null) {
      validator = validator.isFloat({ min }).withMessage(`${fieldName} must be at least ${min}`);
    }
    if (max !== null) {
      validator = validator.isFloat({ max }).withMessage(`${fieldName} must be at most ${max}`);
    }

    return validator;
  },

  // Array validation
  array: (fieldName, min = 1) => body(fieldName)
    .isArray({ min }).withMessage(`${fieldName} must be an array with at least ${min} items`),

  // Boolean validation
  boolean: (fieldName) => body(fieldName)
    .isBoolean().withMessage(`${fieldName} must be a boolean`),

  // String validation
  string: (fieldName, min = 1, max = 500) => body(fieldName)
    .trim()
    .notEmpty().withMessage(`${fieldName} is required`)
    .isLength({ min, max }).withMessage(`${fieldName} must be between ${min} and ${max} characters`),

  // Optional string validation
  optionalString: (fieldName, min = 0, max = 500) => body(fieldName)
    .optional()
    .trim()
    .isLength({ min, max }).withMessage(`${fieldName} must be between ${min} and ${max} characters`),

  // Enum validation
  enum: (fieldName, values) => body(fieldName)
    .trim()
    .isIn(values).withMessage(`${fieldName} must be one of: ${values.join(', ')}`),

  // Credit card validation
  creditCard: body('cardNumber')
    .trim()
    .isCreditCard().withMessage('Invalid credit card number'),

  // URL validation
  url: (fieldName) => body(fieldName)
    .trim()
    .isURL().withMessage(`${fieldName} must be a valid URL`),

  // IP address validation
  ip: (fieldName) => body(fieldName)
    .trim()
    .isIP().withMessage(`${fieldName} must be a valid IP address`)
};

// Preset validation chains
const validationChains = {
  // User registration
  register: [
    validators.email,
    validators.password,
    validators.firstName,
    validators.lastName,
    validators.phone,
    validate
  ],

  // User login
  login: [
    validators.email,
    validators.simplePassword,
    validate
  ],

  // Update profile
  updateProfile: [
    validators.optionalString('firstName', 2, 50),
    validators.optionalString('lastName', 2, 50),
    body('phone').optional().trim().matches(/^[\d\s\-\+\(\)]+$/).withMessage('Must be a valid phone number'),
    validate
  ],

  // Booking creation
  createBooking: [
    validators.string('vehicleId', 24, 24),
    validators.string('serviceId', 24, 24),
    validators.date('scheduledDate'),
    body('scheduledTime').trim().notEmpty().withMessage('Scheduled time is required'),
    validators.optionalString('notes', 0, 500),
    validate
  ],

  // Service creation
  createService: [
    validators.string('name', 2, 100),
    validators.string('description', 10, 500),
    validators.number('price', 0),
    validators.number('duration', 1),
    validators.enum('category', ['basic', 'premium', 'deluxe', 'detail']),
    validate
  ],

  // Vehicle creation
  createVehicle: [
    validators.string('make', 2, 50),
    validators.string('model', 2, 50),
    validators.number('year', 1900, new Date().getFullYear() + 1),
    validators.string('color', 2, 30),
    validators.string('licensePlate', 2, 15),
    validators.enum('type', ['sedan', 'suv', 'truck', 'van', 'sports']),
    validate
  ],

  // Review creation
  createReview: [
    validators.number('score', 1, 5),
    validators.optionalString('comment', 0, 1000),
    validate
  ],

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    validate
  ]
};

module.exports = {
  validate,
  validators,
  validationChains
};
