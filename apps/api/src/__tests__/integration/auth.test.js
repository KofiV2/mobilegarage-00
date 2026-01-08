const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Mock User model
jest.mock('../../models/User');

// Mock JWT
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone: '1234567890',
        role: 'customer'
      };

      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBe('mock-token');

      expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(User.create).toHaveBeenCalledWith(newUser);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: 'customer' },
        'test-secret',
        { expiresIn: '7d' }
      );
    });

    it('should return 400 if email already exists', async () => {
      const newUser = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      };

      User.findByEmail.mockResolvedValue({ id: 1, email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email', async () => {
      const newUser = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const newUser = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle database errors', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      };

      User.findByEmail.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'Test',
        last_name: 'User',
        phone: '1234567890',
        role: 'customer',
        is_active: true
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.comparePassword.mockResolvedValue(true);
      User.updateLastLogin.mockResolvedValue();
      jwt.sign.mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBe('mock-token');

      expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(User.comparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(User.updateLastLogin).toHaveBeenCalledWith(1);
    });

    it('should return 401 for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(User.comparePassword).not.toHaveBeenCalled();
    });

    it('should return 401 for incorrect password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        is_active: true
      };

      User.findByEmail.mockResolvedValue(mockUser);
      User.comparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(User.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should return 403 for deactivated account', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        is_active: false
      };

      User.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Account is deactivated');
      expect(User.comparePassword).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const credentials = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});
