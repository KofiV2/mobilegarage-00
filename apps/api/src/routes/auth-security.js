const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { auth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

// Email verification - Send verification email
router.post('/send-verification-email', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with verification token
    const { error } = await supabase
      .from('users')
      .update({
        email_verification_token: verificationToken,
        email_verification_expiry: verificationExpiry.toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('email, first_name')
      .eq('id', userId)
      .single();

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(user, verificationToken);

    if (!emailResult.success) {
      logger.warn('Email sending failed but token saved', { userId, error: emailResult.error });
    }

    logger.info('Verification email sent', { userId, emailSuccess: emailResult.success });

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    logger.error('Error sending verification email', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// Email verification - Verify email with token
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with this token
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email_verification_token', token)
      .gt('email_verification_expiry', new Date().toISOString())
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const user = users[0];

    // Update user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        email_verification_token: null,
        email_verification_expiry: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    logger.info('Email verified successfully', { userId: user.id });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Error verifying email', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    });
  }
});

// Password reset - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    // Always return success for security (don't reveal if email exists)
    if (!users || users.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists, a password reset email will be sent'
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await supabase
      .from('users')
      .update({
        password_reset_token: resetTokenHash,
        password_reset_expiry: resetExpiry.toISOString()
      })
      .eq('id', user.id);

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);

    if (!emailResult.success) {
      logger.warn('Password reset email failed but token saved', { userId: user.id, error: emailResult.error });
    }

    logger.info('Password reset requested', { userId: user.id, emailSuccess: emailResult.success });

    res.json({
      success: true,
      message: 'If an account exists, a password reset email will be sent'
    });
  } catch (error) {
    logger.error('Error requesting password reset', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
});

// Password reset - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash the token to compare
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', resetTokenHash)
      .gt('password_reset_expiry', new Date().toISOString())
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expiry: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    logger.info('Password reset successful', { userId: user.id });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting password', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// 2FA - Enable Two-Factor Authentication
router.post('/2fa/enable', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `CarWash (${req.user.email})`,
      issuer: 'In and Out Car Wash'
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret temporarily (will be confirmed later)
    await supabase
      .from('users')
      .update({
        two_factor_temp_secret: secret.base32
      })
      .eq('id', userId);

    logger.info('2FA setup initiated', { userId });

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCode
    });
  } catch (error) {
    logger.error('Error enabling 2FA', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA'
    });
  }
});

// 2FA - Verify and confirm Two-Factor Authentication
router.post('/2fa/verify', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Get user's temp secret
    const { data: user } = await supabase
      .from('users')
      .select('two_factor_temp_secret')
      .eq('id', userId)
      .single();

    if (!user || !user.two_factor_temp_secret) {
      return res.status(400).json({
        success: false,
        message: '2FA not initiated. Please start setup first'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_temp_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Move temp secret to permanent and enable 2FA
    await supabase
      .from('users')
      .update({
        two_factor_secret: user.two_factor_temp_secret,
        two_factor_enabled: true,
        two_factor_temp_secret: null
      })
      .eq('id', userId);

    logger.info('2FA enabled successfully', { userId });

    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    logger.error('Error verifying 2FA', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA'
    });
  }
});

// 2FA - Disable Two-Factor Authentication
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Disable 2FA
    await supabase
      .from('users')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_temp_secret: null
      })
      .eq('id', userId);

    logger.info('2FA disabled', { userId });

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    logger.error('Error disabling 2FA', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
});

// Session management - Get active sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's active sessions from database
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      sessions: sessions || []
    });
  } catch (error) {
    logger.error('Error fetching sessions', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// Session management - Revoke session
router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Revoke session
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;

    logger.info('Session revoked', { userId, sessionId });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking session', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to revoke session'
    });
  }
});

// Account lockout - Check and update failed login attempts
router.post('/check-lockout', async (req, res) => {
  try {
    const { email } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('failed_login_attempts, account_locked_until')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if account is locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const lockTimeRemaining = Math.ceil((new Date(user.account_locked_until) - new Date()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${lockTimeRemaining} minutes`,
        locked: true
      });
    }

    res.json({
      success: true,
      locked: false,
      attempts: user.failed_login_attempts || 0
    });
  } catch (error) {
    logger.error('Error checking lockout status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to check lockout status'
    });
  }
});

module.exports = router;
