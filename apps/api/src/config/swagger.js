const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'In and Out Car Wash API',
      version: '1.0.0',
      description: 'Comprehensive Car Wash Management System API with 300+ features',
      contact: {
        name: 'API Support',
        email: 'support@inandoutcarwash.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.inandoutcarwash.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login or /api/auth/register'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email' },
            firstName: { type: 'string', description: 'First name' },
            lastName: { type: 'string', description: 'Last name' },
            phone: { type: 'string', description: 'Phone number' },
            role: {
              type: 'string',
              enum: ['customer', 'staff', 'admin'],
              description: 'User role'
            },
            isActive: { type: 'boolean', description: 'Account active status' },
            isVerified: { type: 'boolean', description: 'Email verification status' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Booking ID' },
            bookingNumber: { type: 'string', description: 'Unique booking number' },
            userId: { type: 'string', description: 'User ID' },
            vehicleId: { type: 'string', description: 'Vehicle ID' },
            serviceId: { type: 'string', description: 'Service ID' },
            scheduledDate: { type: 'string', format: 'date', description: 'Scheduled date' },
            scheduledTime: { type: 'string', description: 'Scheduled time' },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
              description: 'Booking status'
            },
            totalPrice: { type: 'number', description: 'Total price' },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'refunded', 'failed'],
              description: 'Payment status'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Service name' },
            description: { type: 'string', description: 'Service description' },
            price: { type: 'number', description: 'Service price' },
            duration: { type: 'number', description: 'Duration in minutes' },
            category: { type: 'string', description: 'Service category' },
            isActive: { type: 'boolean', description: 'Service availability' }
          }
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Vehicle ID' },
            userId: { type: 'string', description: 'Owner user ID' },
            make: { type: 'string', description: 'Vehicle make' },
            model: { type: 'string', description: 'Vehicle model' },
            year: { type: 'number', description: 'Vehicle year' },
            color: { type: 'string', description: 'Vehicle color' },
            licensePlate: { type: 'string', description: 'License plate number' },
            type: {
              type: 'string',
              enum: ['sedan', 'suv', 'truck', 'van', 'sports'],
              description: 'Vehicle type'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Bookings', description: 'Booking management endpoints' },
      { name: 'Services', description: 'Service catalog endpoints' },
      { name: 'Vehicles', description: 'Vehicle management endpoints' },
      { name: 'Payments', description: 'Payment processing endpoints' },
      { name: 'Loyalty', description: 'Loyalty program endpoints' },
      { name: 'Wallet', description: 'Digital wallet endpoints' },
      { name: 'Reviews', description: 'Review and rating endpoints' },
      { name: 'Employees', description: 'Employee management endpoints' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
