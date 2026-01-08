const User = require('../../models/User');
const bcrypt = require('bcrypt');

// Mock Supabase
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

const { supabaseAdmin } = require('../../config/supabase');

describe('User Model', () => {
  let mockSelect, mockEq, mockSingle, mockInsert, mockUpdate, mockDelete;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn(() => ({ single: mockSingle, select: mockSelect }));
    mockSelect = jest.fn(() => ({ eq: mockEq, single: mockSingle }));
    mockInsert = jest.fn(() => ({ select: mockSelect }));
    mockUpdate = jest.fn(() => ({ eq: mockEq, select: mockSelect }));
    mockDelete = jest.fn(() => ({ eq: mockEq }));

    supabaseAdmin.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = { id: 1, email: 'test@example.com', first_name: 'Test' };
      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await User.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('email', 'test@example.com');
    });

    it('should handle email case insensitivity', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      await User.findByEmail('TEST@EXAMPLE.COM');

      expect(mockEq).toHaveBeenCalledWith('email', 'test@example.com');
    });

    it('should return null when user not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await User.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should throw error for database errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' }
      });

      await expect(User.findByEmail('test@example.com')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Database error'
      });
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await User.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });

    it('should return null when user not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await User.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '1234567890'
      };

      const mockCreatedUser = {
        id: 1,
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        phone: '1234567890',
        role: 'customer'
      };

      mockSingle.mockResolvedValue({ data: mockCreatedUser, error: null });

      const result = await User.create(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockInsert).toHaveBeenCalled();

      const insertedData = mockInsert.mock.calls[0][0][0];
      expect(insertedData.email).toBe('newuser@example.com');
      expect(insertedData.first_name).toBe('New');
      expect(insertedData.last_name).toBe('User');
      expect(insertedData.role).toBe('customer');
      expect(insertedData.is_active).toBe(true);
      expect(insertedData.is_verified).toBe(false);

      // Verify password is hashed
      expect(insertedData.password_hash).toBeDefined();
      expect(insertedData.password_hash).not.toBe('password123');

      const isPasswordHashed = await bcrypt.compare('password123', insertedData.password_hash);
      expect(isPasswordHashed).toBe(true);
    });

    it('should create user with custom role', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '1234567890',
        role: 'admin'
      };

      mockSingle.mockResolvedValue({ data: { id: 1, ...userData }, error: null });

      await User.create(userData);

      const insertedData = mockInsert.mock.calls[0][0][0];
      expect(insertedData.role).toBe('admin');
    });

    it('should handle email case insensitivity on creation', async () => {
      const userData = {
        email: 'NEWUSER@EXAMPLE.COM',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      mockSingle.mockResolvedValue({ data: { id: 1 }, error: null });

      await User.create(userData);

      const insertedData = mockInsert.mock.calls[0][0][0];
      expect(insertedData.email).toBe('newuser@example.com');
    });

    it('should throw error on creation failure', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Duplicate email' }
      });

      await expect(User.create(userData)).rejects.toEqual({
        message: 'Duplicate email'
      });
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);

      const result = await User.comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'password123';
      const wrongPassword = 'wrongpassword';
      const hash = await bcrypt.hash(password, 10);

      const result = await User.comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const updates = { first_name: 'Updated', last_name: 'Name' };
      const mockUpdatedUser = { id: 1, ...updates };

      mockSingle.mockResolvedValue({ data: mockUpdatedUser, error: null });

      const result = await User.update(1, updates);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 1);

      const updateData = mockUpdate.mock.calls[0][0];
      expect(updateData.first_name).toBe('Updated');
      expect(updateData.last_name).toBe('Name');
      expect(updateData.updated_at).toBeDefined();
    });

    it('should throw error on update failure', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      await expect(User.update(1, { first_name: 'Test' })).rejects.toEqual({
        message: 'Update failed'
      });
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockEq.mockResolvedValue({ data: null, error: null });

      await User.updateLastLogin(1);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 1);

      const updateData = mockUpdate.mock.calls[0][0];
      expect(updateData.last_login).toBeInstanceOf(Date);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockEq.mockResolvedValue({ error: null });

      await User.delete(1);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });

    it('should throw error on delete failure', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Delete failed' } });

      await expect(User.delete(1)).rejects.toEqual({
        message: 'Delete failed'
      });
    });
  });
});
