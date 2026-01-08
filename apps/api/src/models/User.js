const bcrypt = require('bcrypt');
const { supabaseAdmin } = require('../config/supabase');

class User {
  // Find user by email
  static async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  }

  // Find user by ID
  static async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Find user by phone number
  static async findByPhone(phone) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Create new user
  static async create(userData) {
    const { email, password, firstName, lastName, phone, role = 'customer' } = userData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        is_active: true,
        is_verified: false
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user
  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // Update last login
  static async updateLastLogin(id) {
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date() })
      .eq('id', id);
  }

  // Delete user
  static async delete(id) {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  // Get all users (with pagination)
  static async getAll(limit = 50, offset = 0) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, role, is_active, is_verified, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data;
  }
}

module.exports = User;
