const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const paymentService = require('../services/paymentService');

// Get user's wallet
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    let { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Create wallet if doesn't exist
    if (error && error.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0,
          currency: 'SAR',
          is_active: true,
          transactions: []
        })
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    } else if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    logger.error('Error fetching wallet', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet'
    });
  }
});

// Add funds to wallet (top-up)
router.post('/topup', auth, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentId } = req.body;
    const userId = req.user.id;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Get wallet
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Check if wallet is active
    if (!wallet.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Wallet is inactive. Please contact support.'
      });
    }

    // Process payment through Stripe
    let paymentResult;
    let actualPaymentId = paymentId;

    if (paymentMethod === 'card' || paymentMethod === 'stripe') {
      // Create payment intent
      paymentResult = await paymentService.createWalletTopUpIntent(
        userId,
        parseFloat(amount),
        paymentMethod
      );

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment processing failed',
          error: paymentResult.error
        });
      }

      // Return client secret for frontend to complete payment
      return res.json({
        success: true,
        message: 'Payment intent created',
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.paymentIntentId,
        amount: paymentResult.amount,
        requiresPaymentConfirmation: true
      });
    }

    // For other payment methods (cash, wallet transfer, etc.)
    // Update wallet balance directly
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    const transactions = wallet.transactions || [];

    // Calculate cashback (5% default)
    const cashback = paymentService.calculateCashback(parseFloat(amount), 5);

    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'credit',
      amount: parseFloat(amount),
      cashback: cashback,
      balance_before: parseFloat(wallet.balance),
      balance_after: newBalance + cashback,
      description: 'Wallet top-up',
      payment_method: paymentMethod,
      payment_id: actualPaymentId || `manual_${Date.now()}`,
      status: 'completed',
      date: new Date().toISOString()
    });

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance + cashback, // Add cashback to balance
        total_cashback_earned: (parseFloat(wallet.total_cashback_earned) || 0) + cashback,
        transactions: transactions
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Wallet topped up', { userId, amount, paymentMethod });

    res.json({
      success: true,
      message: `Successfully added ${amount} SAR to your wallet`,
      data: {
        previousBalance: parseFloat(wallet.balance),
        addedAmount: parseFloat(amount),
        newBalance: newBalance,
        wallet: updatedWallet
      }
    });
  } catch (error) {
    logger.error('Error topping up wallet', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to top up wallet'
    });
  }
});

// Confirm wallet top-up payment (after Stripe confirmation)
router.post('/confirm-topup', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Verify payment with Stripe
    const verificationResult = await paymentService.verifyPaymentIntent(paymentIntentId);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verificationResult.error
      });
    }

    if (!verificationResult.paid) {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: verificationResult.status
      });
    }

    // Get wallet
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Add amount to wallet
    const amount = verificationResult.amount;
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    const transactions = wallet.transactions || [];

    // Calculate cashback
    const cashback = paymentService.calculateCashback(parseFloat(amount), 5);

    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'credit',
      amount: parseFloat(amount),
      cashback: cashback,
      balance_before: parseFloat(wallet.balance),
      balance_after: newBalance + cashback,
      description: 'Wallet top-up (Stripe)',
      payment_method: 'stripe',
      payment_id: paymentIntentId,
      status: 'completed',
      date: new Date().toISOString()
    });

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance + cashback,
        total_cashback_earned: (parseFloat(wallet.total_cashback_earned) || 0) + cashback,
        transactions: transactions
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Wallet topped up via Stripe', { userId, amount, paymentIntentId, cashback });

    res.json({
      success: true,
      message: `Successfully added $${amount} to your wallet (+ $${cashback} cashback)`,
      data: {
        previousBalance: parseFloat(wallet.balance),
        addedAmount: parseFloat(amount),
        cashback: cashback,
        newBalance: newBalance + cashback,
        wallet: updatedWallet
      }
    });
  } catch (error) {
    logger.error('Error confirming wallet top-up', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to confirm wallet top-up',
      error: error.message
    });
  }
});

// Deduct from wallet (for payments)
router.post('/deduct', auth, async (req, res) => {
  try {
    const { amount, bookingId, description } = req.body;
    const userId = req.user.id;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Get wallet
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Check if wallet is active
    if (!wallet.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Wallet is inactive'
      });
    }

    // Check if sufficient balance
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have ${wallet.balance} SAR`
      });
    }

    // Deduct from balance
    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
    const transactions = wallet.transactions || [];

    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'debit',
      amount: -parseFloat(amount),
      balance_before: parseFloat(wallet.balance),
      balance_after: newBalance,
      description: description || 'Payment for service',
      booking_id: bookingId || null,
      status: 'completed',
      date: new Date().toISOString()
    });

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        transactions: transactions
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Wallet deducted', { userId, amount, bookingId });

    res.json({
      success: true,
      message: `Successfully deducted ${amount} SAR from your wallet`,
      data: {
        previousBalance: parseFloat(wallet.balance),
        deductedAmount: parseFloat(amount),
        newBalance: newBalance,
        wallet: updatedWallet
      }
    });
  } catch (error) {
    logger.error('Error deducting from wallet', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to deduct from wallet'
    });
  }
});

// Get wallet transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, type, startDate, endDate } = req.query;

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('transactions')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    let transactions = wallet.transactions || [];

    // Filter by type
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Filter by date range
    if (startDate) {
      transactions = transactions.filter(t => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      transactions = transactions.filter(t => new Date(t.date) <= new Date(endDate));
    }

    // Sort by date descending and limit
    transactions = transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    logger.error('Error fetching transactions', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Transfer funds between wallets
router.post('/transfer', auth, async (req, res) => {
  try {
    const { recipientUserId, amount, note } = req.body;
    const senderId = req.user.id;

    // Validation
    if (!recipientUserId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient user ID and valid amount are required'
      });
    }

    if (senderId === recipientUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to yourself'
      });
    }

    // Get sender wallet
    const { data: senderWallet, error: senderError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', senderId)
      .single();

    if (senderError) throw senderError;

    // Check sender balance
    if (parseFloat(senderWallet.balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Get recipient wallet
    const { data: recipientWallet, error: recipientError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', recipientUserId)
      .single();

    if (recipientError) throw recipientError;

    // Deduct from sender
    const senderNewBalance = parseFloat(senderWallet.balance) - parseFloat(amount);
    const senderTransactions = senderWallet.transactions || [];
    senderTransactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'transfer_out',
      amount: -parseFloat(amount),
      balance_before: parseFloat(senderWallet.balance),
      balance_after: senderNewBalance,
      description: `Transfer to user ${recipientUserId}`,
      note: note || null,
      recipient_id: recipientUserId,
      status: 'completed',
      date: new Date().toISOString()
    });

    // Add to recipient
    const recipientNewBalance = parseFloat(recipientWallet.balance) + parseFloat(amount);
    const recipientTransactions = recipientWallet.transactions || [];
    recipientTransactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'transfer_in',
      amount: parseFloat(amount),
      balance_before: parseFloat(recipientWallet.balance),
      balance_after: recipientNewBalance,
      description: `Transfer from user ${senderId}`,
      note: note || null,
      sender_id: senderId,
      status: 'completed',
      date: new Date().toISOString()
    });

    // Update both wallets
    await supabase
      .from('wallets')
      .update({
        balance: senderNewBalance,
        transactions: senderTransactions
      })
      .eq('user_id', senderId);

    await supabase
      .from('wallets')
      .update({
        balance: recipientNewBalance,
        transactions: recipientTransactions
      })
      .eq('user_id', recipientUserId);

    logger.info('Wallet transfer completed', { senderId, recipientUserId, amount });

    res.json({
      success: true,
      message: `Successfully transferred ${amount} SAR`,
      data: {
        amount: parseFloat(amount),
        newBalance: senderNewBalance
      }
    });
  } catch (error) {
    logger.error('Error transferring funds', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to transfer funds'
    });
  }
});

// Request refund to wallet
router.post('/refund', auth, async (req, res) => {
  try {
    const { bookingId, amount, reason } = req.body;
    const userId = req.user.id;

    if (!bookingId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and valid amount are required'
      });
    }

    // Verify booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get wallet
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Add refund to wallet
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    const transactions = wallet.transactions || [];

    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'refund',
      amount: parseFloat(amount),
      balance_before: parseFloat(wallet.balance),
      balance_after: newBalance,
      description: `Refund for booking ${booking.booking_number}`,
      booking_id: bookingId,
      reason: reason || null,
      status: 'completed',
      date: new Date().toISOString()
    });

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        transactions: transactions
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Refund processed to wallet', { userId, amount, bookingId });

    res.json({
      success: true,
      message: `Refund of ${amount} SAR added to your wallet`,
      data: {
        refundAmount: parseFloat(amount),
        newBalance: newBalance,
        wallet: updatedWallet
      }
    });
  } catch (error) {
    logger.error('Error processing refund', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// Admin: Get all wallets
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, minBalance, maxBalance } = req.query;

    let query = supabase
      .from('wallets')
      .select(`
        *,
        users:user_id (id, email, first_name, last_name)
      `, { count: 'exact' });

    if (minBalance) {
      query = query.gte('balance', parseFloat(minBalance));
    }
    if (maxBalance) {
      query = query.lte('balance', parseFloat(maxBalance));
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('balance', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: wallets, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: wallets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching wallets', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallets'
    });
  }
});

// Admin: Manually adjust wallet balance
router.post('/admin/adjust/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const adjustment = parseFloat(amount);
    const newBalance = Math.max(0, parseFloat(wallet.balance) + adjustment);
    const transactions = wallet.transactions || [];

    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: adjustment > 0 ? 'admin_credit' : 'admin_debit',
      amount: adjustment,
      balance_before: parseFloat(wallet.balance),
      balance_after: newBalance,
      description: reason || `Admin adjustment by ${req.user.email}`,
      status: 'completed',
      date: new Date().toISOString()
    });

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        transactions: transactions
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Wallet adjusted by admin', {
      adminId: req.user.id,
      userId,
      adjustment,
      reason
    });

    res.json({
      success: true,
      message: `Wallet adjusted by ${adjustment} SAR`,
      data: updatedWallet
    });
  } catch (error) {
    logger.error('Error adjusting wallet', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to adjust wallet'
    });
  }
});

// Admin: Toggle wallet active status
router.patch('/admin/toggle/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({ is_active: !wallet.is_active })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Wallet status toggled', {
      adminId: req.user.id,
      userId,
      newStatus: updatedWallet.is_active
    });

    res.json({
      success: true,
      message: `Wallet ${updatedWallet.is_active ? 'activated' : 'deactivated'}`,
      data: updatedWallet
    });
  } catch (error) {
    logger.error('Error toggling wallet status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to toggle wallet status'
    });
  }
});

// ============================================
// ENHANCED WALLET FEATURES
// ============================================

// Configure cashback settings
router.post('/cashback/configure', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled, percentage } = req.body;

    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Cashback percentage must be between 0 and 100'
      });
    }

    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const cashbackSettings = wallet.cashback_settings || {
      enabled: false,
      percentage: 0,
      total_earned: 0,
      last_updated: new Date().toISOString()
    };

    if (enabled !== undefined) cashbackSettings.enabled = enabled;
    if (percentage !== undefined) cashbackSettings.percentage = percentage;
    cashbackSettings.last_updated = new Date().toISOString();

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({ cashback_settings: cashbackSettings })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Cashback settings updated', { userId, cashbackSettings });

    res.json({
      success: true,
      message: 'Cashback settings updated successfully',
      data: updatedWallet
    });
  } catch (error) {
    logger.error('Error configuring cashback', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to configure cashback'
    });
  }
});

// Get cashback history
router.get('/cashback/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('transactions, cashback_settings')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const transactions = wallet.transactions || [];
    const cashbackTransactions = transactions
      .filter(t => t.type === 'cashback')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        cashbackSettings: wallet.cashback_settings,
        transactions: cashbackTransactions,
        totalEarned: wallet.cashback_settings?.total_earned || 0
      }
    });
  } catch (error) {
    logger.error('Error fetching cashback history', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cashback history'
    });
  }
});

// Process cashback (called after payment completion)
router.post('/cashback/process', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId, paymentAmount } = req.body;

    if (!bookingId || !paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and valid payment amount are required'
      });
    }

    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const cashbackSettings = wallet.cashback_settings || { enabled: false, percentage: 0 };

    if (!cashbackSettings.enabled || cashbackSettings.percentage <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cashback is not enabled for this wallet'
      });
    }

    const cashbackAmount = parseFloat((paymentAmount * (cashbackSettings.percentage / 100)).toFixed(2));
    const newBalance = parseFloat(wallet.balance) + cashbackAmount;

    const transactions = wallet.transactions || [];
    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'cashback',
      amount: cashbackAmount,
      balance_before: parseFloat(wallet.balance),
      balance_after: newBalance,
      description: `${cashbackSettings.percentage}% cashback on ${paymentAmount} SAR payment`,
      booking_id: bookingId,
      payment_amount: paymentAmount,
      cashback_percentage: cashbackSettings.percentage,
      status: 'completed',
      date: new Date().toISOString()
    });

    cashbackSettings.total_earned = (cashbackSettings.total_earned || 0) + cashbackAmount;

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        transactions: transactions,
        cashback_settings: cashbackSettings
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Cashback processed', { userId, cashbackAmount, bookingId });

    res.json({
      success: true,
      message: `Cashback of ${cashbackAmount} SAR credited to your wallet`,
      data: {
        cashbackAmount,
        paymentAmount,
        percentage: cashbackSettings.percentage,
        newBalance,
        wallet: updatedWallet
      }
    });
  } catch (error) {
    logger.error('Error processing cashback', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process cashback'
    });
  }
});

// Configure auto-reload settings
router.post('/auto-reload/configure', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled, threshold, reloadAmount, paymentMethod } = req.body;

    if (threshold !== undefined && threshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be a positive number'
      });
    }

    if (reloadAmount !== undefined && reloadAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Reload amount must be greater than 0'
      });
    }

    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const autoReloadSettings = wallet.auto_reload_settings || {
      enabled: false,
      threshold: 50,
      reload_amount: 200,
      payment_method: 'stripe',
      last_reload_date: null,
      total_reloads: 0
    };

    if (enabled !== undefined) autoReloadSettings.enabled = enabled;
    if (threshold !== undefined) autoReloadSettings.threshold = threshold;
    if (reloadAmount !== undefined) autoReloadSettings.reload_amount = reloadAmount;
    if (paymentMethod !== undefined) autoReloadSettings.payment_method = paymentMethod;

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({ auto_reload_settings: autoReloadSettings })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Auto-reload settings updated', { userId, autoReloadSettings });

    res.json({
      success: true,
      message: 'Auto-reload settings updated successfully',
      data: updatedWallet
    });
  } catch (error) {
    logger.error('Error configuring auto-reload', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to configure auto-reload'
    });
  }
});

// Get auto-reload settings
router.get('/auto-reload/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('auto_reload_settings, balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const autoReloadSettings = wallet.auto_reload_settings || {
      enabled: false,
      threshold: 50,
      reload_amount: 200,
      payment_method: 'stripe',
      last_reload_date: null,
      total_reloads: 0
    };

    const willTrigger = autoReloadSettings.enabled &&
                        parseFloat(wallet.balance) < autoReloadSettings.threshold;

    res.json({
      success: true,
      data: {
        settings: autoReloadSettings,
        currentBalance: parseFloat(wallet.balance),
        willTrigger
      }
    });
  } catch (error) {
    logger.error('Error fetching auto-reload settings', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auto-reload settings'
    });
  }
});

// Trigger auto-reload (called automatically when balance drops below threshold)
router.post('/auto-reload/trigger', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const autoReloadSettings = wallet.auto_reload_settings || { enabled: false };

    if (!autoReloadSettings.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Auto-reload is not enabled'
      });
    }

    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance >= autoReloadSettings.threshold) {
      return res.status(400).json({
        success: false,
        message: `Balance (${currentBalance} SAR) is above threshold (${autoReloadSettings.threshold} SAR)`
      });
    }

    const reloadAmount = autoReloadSettings.reload_amount;
    const newBalance = currentBalance + reloadAmount;

    const transactions = wallet.transactions || [];
    transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'auto_reload',
      amount: reloadAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Auto-reload triggered (balance below ${autoReloadSettings.threshold} SAR)`,
      payment_method: autoReloadSettings.payment_method,
      status: 'completed',
      date: new Date().toISOString()
    });

    autoReloadSettings.last_reload_date = new Date().toISOString();
    autoReloadSettings.total_reloads = (autoReloadSettings.total_reloads || 0) + 1;

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        transactions: transactions,
        auto_reload_settings: autoReloadSettings
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Auto-reload triggered', { userId, reloadAmount, newBalance });

    res.json({
      success: true,
      message: `Auto-reload successful: Added ${reloadAmount} SAR to wallet`,
      data: {
        reloadAmount,
        previousBalance: currentBalance,
        newBalance,
        totalReloads: autoReloadSettings.total_reloads,
        wallet: updatedWallet
      }
    });
  } catch (error) {
    logger.error('Error triggering auto-reload', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to trigger auto-reload'
    });
  }
});

// Get wallet statistics (balance trends, spending patterns)
router.get('/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 30 } = req.query;

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const transactions = wallet.transactions || [];
    const periodDays = parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const periodTransactions = transactions.filter(
      t => new Date(t.date) >= cutoffDate
    );

    const totalCredits = periodTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = Math.abs(
      periodTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const transactionsByType = periodTransactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});

    const cashbackEarned = periodTransactions
      .filter(t => t.type === 'cashback')
      .reduce((sum, t) => sum + t.amount, 0);

    const autoReloads = periodTransactions.filter(t => t.type === 'auto_reload').length;

    res.json({
      success: true,
      data: {
        period: `${periodDays} days`,
        currentBalance: parseFloat(wallet.balance),
        totalCredits: parseFloat(totalCredits.toFixed(2)),
        totalDebits: parseFloat(totalDebits.toFixed(2)),
        netChange: parseFloat((totalCredits - totalDebits).toFixed(2)),
        transactionCount: periodTransactions.length,
        transactionsByType,
        cashbackEarned: parseFloat(cashbackEarned.toFixed(2)),
        autoReloadsCount: autoReloads,
        cashbackSettings: wallet.cashback_settings,
        autoReloadSettings: wallet.auto_reload_settings
      }
    });
  } catch (error) {
    logger.error('Error fetching wallet statistics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet statistics'
    });
  }
});

// Admin: Get cashback report
router.get('/admin/cashback-report', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    let query = supabase
      .from('wallets')
      .select(`
        *,
        users:user_id (id, email, first_name, last_name)
      `)
      .not('cashback_settings', 'is', null);

    const { data: wallets, error } = await query;

    if (error) throw error;

    const report = wallets.map(wallet => {
      const cashbackSettings = wallet.cashback_settings || {};
      const transactions = wallet.transactions || [];

      let cashbackTransactions = transactions.filter(t => t.type === 'cashback');

      if (startDate) {
        cashbackTransactions = cashbackTransactions.filter(
          t => new Date(t.date) >= new Date(startDate)
        );
      }
      if (endDate) {
        cashbackTransactions = cashbackTransactions.filter(
          t => new Date(t.date) <= new Date(endDate)
        );
      }

      const totalCashback = cashbackTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        userId: wallet.user_id,
        user: wallet.users,
        cashbackEnabled: cashbackSettings.enabled || false,
        cashbackPercentage: cashbackSettings.percentage || 0,
        totalCashbackEarned: cashbackSettings.total_earned || 0,
        periodCashback: parseFloat(totalCashback.toFixed(2)),
        transactionCount: cashbackTransactions.length
      };
    })
    .filter(r => r.cashbackEnabled)
    .sort((a, b) => b.totalCashbackEarned - a.totalCashbackEarned)
    .slice(0, parseInt(limit));

    const totalPaid = report.reduce((sum, r) => sum + r.totalCashbackEarned, 0);

    res.json({
      success: true,
      data: {
        report,
        summary: {
          totalUsers: report.length,
          totalCashbackPaid: parseFloat(totalPaid.toFixed(2))
        }
      }
    });
  } catch (error) {
    logger.error('Error generating cashback report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to generate cashback report'
    });
  }
});

// Admin: Get auto-reload report
router.get('/admin/auto-reload-report', adminAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { data: wallets, error } = await supabase
      .from('wallets')
      .select(`
        *,
        users:user_id (id, email, first_name, last_name)
      `)
      .not('auto_reload_settings', 'is', null);

    if (error) throw error;

    const report = wallets.map(wallet => {
      const autoReloadSettings = wallet.auto_reload_settings || {};
      const transactions = wallet.transactions || [];

      const autoReloadTransactions = transactions.filter(t => t.type === 'auto_reload');
      const totalReloaded = autoReloadTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        userId: wallet.user_id,
        user: wallet.users,
        autoReloadEnabled: autoReloadSettings.enabled || false,
        threshold: autoReloadSettings.threshold || 0,
        reloadAmount: autoReloadSettings.reload_amount || 0,
        totalReloads: autoReloadSettings.total_reloads || 0,
        lastReloadDate: autoReloadSettings.last_reload_date,
        totalReloaded: parseFloat(totalReloaded.toFixed(2)),
        currentBalance: parseFloat(wallet.balance)
      };
    })
    .filter(r => r.autoReloadEnabled)
    .sort((a, b) => b.totalReloads - a.totalReloads)
    .slice(0, parseInt(limit));

    const totalReloaded = report.reduce((sum, r) => sum + r.totalReloaded, 0);
    const totalReloads = report.reduce((sum, r) => sum + r.totalReloads, 0);

    res.json({
      success: true,
      data: {
        report,
        summary: {
          totalUsers: report.length,
          totalReloads,
          totalReloaded: parseFloat(totalReloaded.toFixed(2))
        }
      }
    });
  } catch (error) {
    logger.error('Error generating auto-reload report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to generate auto-reload report'
    });
  }
});

module.exports = router;
