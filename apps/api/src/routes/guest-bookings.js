const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const emailService = require('../services/emailService');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a unique confirmation code
const generateConfirmationCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Generate a unique booking number
const generateBookingNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `GUE${timestamp}${random}`;
};

// Create guest booking (no authentication required)
router.post('/', async (req, res) => {
  try {
    const {
      guest_name,
      guest_phone,
      guest_email,
      service_id,
      vehicle_info,
      scheduled_date,
      scheduled_time,
      location_type,
      address,
      notes,
      total_price
    } = req.body;

    // Validation
    if (!guest_name || !guest_phone || !guest_email || !service_id || !vehicle_info || !scheduled_date || !scheduled_time) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['guest_name', 'guest_phone', 'guest_email', 'service_id', 'vehicle_info', 'scheduled_date', 'scheduled_time']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guest_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Generate unique codes
    const confirmationCode = generateConfirmationCode();
    const bookingNumber = generateBookingNumber();

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time}`);

    // Create booking in database
    const { data: booking, error: bookingError } = await supabase
      .from('guest_bookings')
      .insert([
        {
          booking_number: bookingNumber,
          confirmation_code: confirmationCode,
          guest_name,
          guest_phone,
          guest_email,
          service_id,
          vehicle_info,
          scheduled_date: scheduledDateTime.toISOString(),
          location_type: location_type || 'at_location',
          address: address || null,
          notes: notes || null,
          total_price: parseFloat(total_price) || 0,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (bookingError) {
      console.error('Supabase error:', bookingError);
      return res.status(500).json({ error: 'Failed to create booking', details: bookingError.message });
    }

    // Fetch service name for email
    const { data: serviceData } = await supabase
      .from('services')
      .select('name')
      .eq('id', service_id)
      .single();

    // Send confirmation email
    try {
      await emailService.sendGuestBookingConfirmation({
        email: guest_email,
        name: guest_name,
        bookingNumber,
        confirmationCode,
        scheduledDate: scheduledDateTime,
        vehicleInfo: vehicle_info,
        serviceName: serviceData?.name || 'Car Wash Service',
        totalPrice: total_price
      });
      console.log(`✅ Guest booking created: ${bookingNumber} - Confirmation email sent to: ${guest_email}`);
    } catch (emailError) {
      // Log email error but don't fail the booking
      console.error('⚠️ Failed to send confirmation email:', emailError.message);
      console.log(`Guest booking created: ${bookingNumber} - Confirmation: ${confirmationCode}`);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        bookingNumber: booking.booking_number,
        confirmationCode: booking.confirmation_code,
        scheduledDate: booking.scheduled_date,
        status: booking.status
      },
      confirmationCode: booking.confirmation_code
    });

  } catch (error) {
    console.error('Guest booking error:', error);
    res.status(500).json({
      error: 'Failed to create guest booking',
      message: error.message
    });
  }
});

// Get guest booking by confirmation code
router.get('/confirmation/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Confirmation code required' });
    }

    const { data: booking, error } = await supabase
      .from('guest_bookings')
      .select(`
        *,
        services (
          id,
          name,
          description,
          base_price,
          duration_minutes,
          category
        )
      `)
      .eq('confirmation_code', code.toUpperCase())
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      error: 'Failed to retrieve booking',
      message: error.message
    });
  }
});

// Cancel guest booking
router.post('/cancel/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { reason } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Confirmation code required' });
    }

    // Check if booking exists and is not already cancelled/completed
    const { data: existingBooking, error: checkError } = await supabase
      .from('guest_bookings')
      .select('*')
      .eq('confirmation_code', code.toUpperCase())
      .single();

    if (checkError || !existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (existingBooking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (existingBooking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed booking' });
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('guest_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Cancelled by guest'
      })
      .eq('confirmation_code', code.toUpperCase())
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to cancel booking' });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

module.exports = router;
