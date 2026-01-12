const admin = require('firebase-admin');
const webPush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/notifications.log' }),
    new winston.transports.Console()
  ]
});

// Initialize Firebase Admin (if credentials are provided)
let firebaseInitialized = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.warn('Firebase Admin initialization failed:', error.message);
  }
}

// Initialize Web Push (VAPID keys)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@carwash.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  logger.info('Web Push configured successfully');
} else {
  logger.warn('Web Push VAPID keys not configured');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Notification Service
 * Handles push notifications for mobile (FCM) and web (Web Push)
 */
class NotificationService {
  /**
   * Save device token to database
   * @param {string} userId - User ID
   * @param {string} token - FCM token or web push subscription
   * @param {string} platform - 'mobile', 'web', 'ios', 'android'
   * @param {object} subscription - Web push subscription object (for web)
   */
  async saveDeviceToken(userId, token, platform, subscription = null) {
    try {
      const { data, error } = await supabase
        .from('notification_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            platform,
            subscription: subscription ? JSON.stringify(subscription) : null,
            is_active: true,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,token',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Error saving device token:', error);
        throw error;
      }

      logger.info(`Device token saved for user ${userId} on ${platform}`);
      return data;
    } catch (error) {
      logger.error('Error in saveDeviceToken:', error);
      throw error;
    }
  }

  /**
   * Get all active tokens for a user
   * @param {string} userId - User ID
   */
  async getUserTokens(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting user tokens:', error);
      return [];
    }
  }

  /**
   * Delete a device token
   * @param {string} userId - User ID
   * @param {string} token - Token to delete
   */
  async deleteDeviceToken(userId, token) {
    try {
      const { error } = await supabase
        .from('notification_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('token', token);

      if (error) throw error;

      logger.info(`Device token deleted for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting device token:', error);
      return false;
    }
  }

  /**
   * Send push notification via FCM (Firebase Cloud Messaging)
   * @param {string} token - FCM token
   * @param {object} notification - Notification payload
   */
  async sendFCMNotification(token, notification) {
    if (!firebaseInitialized) {
      logger.warn('Firebase not initialized, skipping FCM notification');
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      logger.info(`FCM notification sent successfully:`, response);
      return { success: true, messageId: response };
    } catch (error) {
      logger.error('Error sending FCM notification:', error);

      // Handle invalid tokens
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        logger.info(`Invalid token detected, marking as inactive: ${token}`);
        await this.markTokenInactive(token);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Send web push notification
   * @param {object} subscription - Web push subscription
   * @param {object} notification - Notification payload
   */
  async sendWebPushNotification(subscription, notification) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      logger.warn('VAPID keys not configured, skipping web push notification');
      return { success: false, error: 'Web Push not configured' };
    }

    try {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/badge-72x72.png',
        data: notification.data || {},
        tag: notification.tag || 'default',
        requireInteraction: notification.requireInteraction || false,
      });

      const response = await webPush.sendNotification(subscription, payload);
      logger.info('Web push notification sent successfully');
      return { success: true, response };
    } catch (error) {
      logger.error('Error sending web push notification:', error);

      // Handle expired subscriptions
      if (error.statusCode === 410) {
        logger.info('Subscription expired, marking as inactive');
        await this.markSubscriptionInactive(subscription);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to a user (all their devices)
   * @param {string} userId - User ID
   * @param {object} notification - Notification payload
   */
  async sendToUser(userId, notification) {
    try {
      // Check if user has notifications enabled
      const { data: user } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (user?.notification_preferences?.enabled === false) {
        logger.info(`Notifications disabled for user ${userId}`);
        return { success: true, message: 'User has notifications disabled' };
      }

      const tokens = await this.getUserTokens(userId);

      if (tokens.length === 0) {
        logger.info(`No active tokens found for user ${userId}`);
        return { success: true, message: 'No active tokens' };
      }

      const results = [];

      for (const tokenData of tokens) {
        let result;

        if (tokenData.platform === 'web' && tokenData.subscription) {
          const subscription = JSON.parse(tokenData.subscription);
          result = await this.sendWebPushNotification(subscription, notification);
        } else {
          result = await this.sendFCMNotification(tokenData.token, notification);
        }

        results.push({
          platform: tokenData.platform,
          success: result.success,
          error: result.error
        });
      }

      // Log notification to database
      await this.logNotification(userId, notification, results);

      return {
        success: true,
        results,
        sentTo: results.filter(r => r.success).length
      };
    } catch (error) {
      logger.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   * @param {array} userIds - Array of user IDs
   * @param {object} notification - Notification payload
   */
  async sendToMultipleUsers(userIds, notification) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, notification);
        results.push({ userId, ...result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send broadcast notification to all users
   * @param {object} notification - Notification payload
   * @param {object} filters - Optional filters (role, location, etc.)
   */
  async sendBroadcast(notification, filters = {}) {
    try {
      let query = supabase
        .from('users')
        .select('id');

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      const userIds = users.map(u => u.id);
      return await this.sendToMultipleUsers(userIds, notification);
    } catch (error) {
      logger.error('Error sending broadcast notification:', error);
      throw error;
    }
  }

  /**
   * Send booking confirmation notification
   * @param {string} userId - User ID
   * @param {object} booking - Booking data
   */
  async sendBookingConfirmation(userId, booking) {
    const notification = {
      title: 'Booking Confirmed!',
      body: `Your car wash is scheduled for ${new Date(booking.scheduled_time).toLocaleString()}`,
      data: {
        type: 'booking_confirmed',
        bookingId: booking.id,
        action: 'view_booking'
      },
      tag: `booking-${booking.id}`,
      requireInteraction: true
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Send booking status change notification
   * @param {string} userId - User ID
   * @param {object} booking - Booking data
   * @param {string} status - New status
   */
  async sendBookingStatusUpdate(userId, booking, status) {
    const statusMessages = {
      'confirmed': 'Your booking has been confirmed',
      'in_progress': 'Your car wash is now in progress',
      'completed': 'Your car wash has been completed!',
      'cancelled': 'Your booking has been cancelled',
    };

    const notification = {
      title: 'Booking Status Update',
      body: statusMessages[status] || `Booking status changed to ${status}`,
      data: {
        type: 'booking_status',
        bookingId: booking.id,
        status,
        action: 'view_booking'
      },
      tag: `booking-${booking.id}`,
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Send booking reminder notification
   * @param {string} userId - User ID
   * @param {object} booking - Booking data
   */
  async sendBookingReminder(userId, booking) {
    const notification = {
      title: 'Upcoming Car Wash Reminder',
      body: `Your car wash is scheduled for ${new Date(booking.scheduled_time).toLocaleString()}`,
      data: {
        type: 'booking_reminder',
        bookingId: booking.id,
        action: 'view_booking'
      },
      tag: `reminder-${booking.id}`,
      requireInteraction: true
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Send promotional notification
   * @param {string} userId - User ID
   * @param {object} promotion - Promotion data
   */
  async sendPromotion(userId, promotion) {
    const notification = {
      title: promotion.title || 'Special Offer!',
      body: promotion.message,
      data: {
        type: 'promotion',
        promotionId: promotion.id,
        action: 'view_promotion'
      },
      tag: `promo-${promotion.id}`,
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Log notification to database
   * @param {string} userId - User ID
   * @param {object} notification - Notification payload
   * @param {array} results - Send results
   */
  async logNotification(userId, notification, results) {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          results: JSON.stringify(results),
          sent_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Error logging notification:', error);
      }
    } catch (error) {
      logger.error('Error in logNotification:', error);
    }
  }

  /**
   * Mark token as inactive
   * @param {string} token - Token to mark inactive
   */
  async markTokenInactive(token) {
    try {
      await supabase
        .from('notification_tokens')
        .update({ is_active: false })
        .eq('token', token);
    } catch (error) {
      logger.error('Error marking token inactive:', error);
    }
  }

  /**
   * Mark subscription as inactive
   * @param {object} subscription - Subscription to mark inactive
   */
  async markSubscriptionInactive(subscription) {
    try {
      await supabase
        .from('notification_tokens')
        .update({ is_active: false })
        .eq('subscription', JSON.stringify(subscription));
    } catch (error) {
      logger.error('Error marking subscription inactive:', error);
    }
  }

  /**
   * Get notification history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of notifications to retrieve
   */
  async getNotificationHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {object} preferences - Notification preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ notification_preferences: preferences })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info(`Notification preferences updated for user ${userId}`);
      return data;
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   */
  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data?.notification_preferences || {
        enabled: true,
        bookingConfirmation: true,
        bookingReminder: true,
        bookingStatusUpdate: true,
        promotions: true,
      };
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      return null;
    }
  }
}

module.exports = new NotificationService();
