const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

// Get all reviews (public endpoint with filters)
router.get('/', async (req, res) => {
  try {
    const {
      serviceId,
      userId,
      rating,
      isPublic = true,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      order = 'desc'
    } = req.query;

    let query = supabase
      .from('reviews')
      .select(`
        *,
        users:user_id (id, first_name, last_name, profile_picture),
        bookings:booking_id (id, booking_number, service_id, services:service_id (name))
      `, { count: 'exact' });

    // Apply filters
    if (serviceId) {
      query = query.eq('bookings.service_id', serviceId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }
    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic === 'true');
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order(sortBy, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: reviews, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching reviews', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users:user_id (id, first_name, last_name, profile_picture),
        bookings:booking_id (
          id,
          booking_number,
          service_id,
          services:service_id (name, description)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Error fetching review', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review'
    });
  }
});

// Create review (authenticated users only, must have completed booking)
router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, rating, comment, photos } = req.body;
    const userId = req.user.id;

    // Validation
    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or does not belong to you'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if review already exists for this booking
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        rating: parseInt(rating),
        comment: comment || null,
        photos: photos || null,
        is_public: true,
        helpful_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Review created', { reviewId: review.id, userId, bookingId });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    logger.error('Error creating review', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
});

// Update review (only by review owner)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, photos, isPublic } = req.body;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or does not belong to you'
      });
    }

    // Prepare update data
    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      updateData.rating = parseInt(rating);
    }
    if (comment !== undefined) updateData.comment = comment;
    if (photos !== undefined) updateData.photos = photos;
    if (isPublic !== undefined) updateData.is_public = isPublic;
    updateData.updated_at = new Date().toISOString();

    // Update review
    const { data: review, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Review updated', { reviewId: id, userId });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    logger.error('Error updating review', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

// Delete review (only by review owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Build query
    let query = supabase.from('reviews').select('*').eq('id', id);

    // Non-admins can only delete their own reviews
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data: existingReview, error: fetchError } = await query.single();

    if (fetchError || !existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    // Delete review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.info('Review deleted', { reviewId: id, userId, isAdmin });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting review', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

// Admin: Add response to review
router.post('/:id/response', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        response: response,
        response_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Admin response added to review', { reviewId: id });

    res.json({
      success: true,
      message: 'Response added successfully',
      data: review
    });
  } catch (error) {
    logger.error('Error adding response to review', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
});

// Mark review as helpful
router.post('/:id/helpful', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Increment helpful count
    const { data: review, error } = await supabase.rpc('increment_helpful_count', {
      review_id: id
    });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: currentReview } = await supabase
        .from('reviews')
        .select('helpful_count')
        .eq('id', id)
        .single();

      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({ helpful_count: (currentReview?.helpful_count || 0) + 1 })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.json({
        success: true,
        message: 'Marked as helpful',
        data: updatedReview
      });
    }

    res.json({
      success: true,
      message: 'Marked as helpful',
      data: review
    });
  } catch (error) {
    logger.error('Error marking review as helpful', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to mark as helpful'
    });
  }
});

// Get review statistics for a service
router.get('/stats/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Get all reviews for bookings of this service
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('service_id', serviceId);

    if (bookingsError) throw bookingsError;

    const bookingIds = bookings.map(b => b.id);

    if (bookingIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      });
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .in('booking_id', bookingIds);

    if (error) throw error;

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution
      }
    });
  } catch (error) {
    logger.error('Error fetching review stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics'
    });
  }
});

module.exports = router;
