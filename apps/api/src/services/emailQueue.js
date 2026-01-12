/**
 * Email Queue Service
 *
 * Handles async email sending to prevent blocking API responses.
 * Uses a simple in-memory queue with retry logic.
 *
 * For production, consider replacing with:
 * - Bull (Redis-based queue)
 * - AWS SQS
 * - RabbitMQ
 */

const emailService = require('./emailService');

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.processInterval = null;
  }

  /**
   * Initialize the queue processor
   */
  start() {
    if (this.processInterval) {
      console.log('Email queue already running');
      return;
    }

    console.log('Starting email queue processor...');
    this.processInterval = setInterval(() => this.processQueue(), 2000);
  }

  /**
   * Stop the queue processor
   */
  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('Email queue processor stopped');
    }
  }

  /**
   * Add email to queue
   * @param {string} type - Email type (booking_confirmation, status_update, etc.)
   * @param {object} data - Email data
   */
  async enqueue(type, data) {
    const emailJob = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      retries: 0,
      createdAt: new Date(),
      status: 'pending'
    };

    this.queue.push(emailJob);
    console.log(`Email job queued: ${type} (ID: ${emailJob.id})`);

    return emailJob.id;
  }

  /**
   * Process the email queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const job = this.queue[0];

      if (!job || job.status === 'processing') {
        this.processing = false;
        return;
      }

      job.status = 'processing';
      console.log(`Processing email job: ${job.type} (ID: ${job.id})`);

      const result = await this.sendEmail(job);

      if (result.success) {
        // Remove from queue on success
        this.queue.shift();
        console.log(`Email job completed: ${job.type} (ID: ${job.id})`);
      } else {
        // Retry logic
        job.retries++;
        job.status = 'pending';

        if (job.retries >= this.maxRetries) {
          console.error(`Email job failed after ${this.maxRetries} retries: ${job.type} (ID: ${job.id})`);
          this.queue.shift(); // Remove failed job
        } else {
          console.warn(`Email job retry ${job.retries}/${this.maxRetries}: ${job.type} (ID: ${job.id})`);
          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(job);
        }
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Send email based on job type
   * @param {object} job - Email job
   */
  async sendEmail(job) {
    try {
      switch (job.type) {
        case 'booking_confirmation':
          return await emailService.sendBookingConfirmation(
            job.data.user,
            job.data.booking
          );

        case 'booking_status_update':
          return await emailService.sendBookingStatusUpdate(
            job.data.user,
            job.data.booking,
            job.data.oldStatus,
            job.data.newStatus
          );

        case 'booking_cancellation':
          return await emailService.sendBookingCancellation(
            job.data.user,
            job.data.booking,
            job.data.reason
          );

        case 'booking_reminder':
          return await emailService.sendBookingReminder(
            job.data.user,
            job.data.booking
          );

        case 'guest_booking_confirmation':
          return await emailService.sendGuestBookingConfirmation(job.data);

        case 'password_reset':
          return await emailService.sendPasswordResetEmail(
            job.data.user,
            job.data.resetToken
          );

        case 'email_verification':
          return await emailService.sendVerificationEmail(
            job.data.user,
            job.data.verificationToken
          );

        case 'welcome':
          return await emailService.sendWelcomeEmail(job.data.user);

        default:
          console.error(`Unknown email job type: ${job.type}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      console.error(`Error sending email (${job.type}):`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      jobs: this.queue.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        retries: job.retries,
        createdAt: job.createdAt
      }))
    };
  }

  /**
   * Clear all pending jobs
   */
  clear() {
    const count = this.queue.length;
    this.queue = [];
    console.log(`Cleared ${count} email jobs from queue`);
    return count;
  }

  /**
   * Send email immediately (bypass queue)
   * Use this for critical emails that should not be queued
   */
  async sendImmediate(type, data) {
    console.log(`Sending immediate email: ${type}`);
    const job = { type, data, retries: 0 };
    return await this.sendEmail(job);
  }
}

// Create singleton instance
const emailQueue = new EmailQueue();

// Auto-start the queue processor
emailQueue.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down email queue...');
  emailQueue.stop();
});

process.on('SIGTERM', () => {
  console.log('Shutting down email queue...');
  emailQueue.stop();
});

module.exports = emailQueue;
