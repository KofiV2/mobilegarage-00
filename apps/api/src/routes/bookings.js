const express = require('express');
const { auth, staffAuth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Vehicle = require('../models/Vehicle');

const router = express.Router();

// Get user's bookings
router.get('/', auth, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = { userId: req.userId };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name description basePrice duration image category')
      .populate('vehicleId', 'make model year color licensePlate vehicleType')
      .sort({ scheduledDate: -1, createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings (staff only)
router.get('/all', staffAuth, async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const bookings = await Booking.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('serviceId', 'name duration')
      .populate('vehicleId', 'make model licensePlate vehicleType')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId')
      .populate('vehicleId')
      .populate('userId', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId._id.toString() !== req.userId.toString() && req.user.role === 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { serviceId, vehicleId, scheduledDate, scheduledTime, notes, paymentMethod } = req.body;

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.userId });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    let totalPrice = service.basePrice;
    const vehicleTypeConfig = service.vehicleTypes.find(vt => vt.type === vehicle.vehicleType);
    if (vehicleTypeConfig) {
      totalPrice += vehicleTypeConfig.priceModifier;
    }

    const booking = new Booking({
      userId: req.userId,
      serviceId,
      vehicleId,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      totalPrice,
      notes,
      paymentMethod: paymentMethod || 'card',
      status: 'pending'
    });

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('serviceId')
      .populate('vehicleId');

    res.status(201).json({ booking: populatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status (staff only)
router.patch('/:id/status', staffAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = status;

    if (status === 'completed') {
      booking.completedAt = new Date();
    } else if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancellationReason = req.body.cancellationReason;
    }

    if (req.body.assignedTo) {
      booking.assignedTo = req.body.assignedTo;
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('serviceId')
      .populate('vehicleId')
      .populate('userId', 'firstName lastName email phone');

    res.json({ booking: populatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by customer';

    await booking.save();

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add rating
router.post('/:id/rating', auth, async (req, res) => {
  try {
    const { score, comment } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed bookings' });
    }

    booking.rating = {
      score,
      comment,
      createdAt: new Date()
    };

    await booking.save();

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available time slots
router.get('/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { serviceId } = req.query;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await Booking.find({
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).select('scheduledTime');

    const allSlots = [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    const bookedTimes = bookedSlots.map(b => b.scheduledTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ availableSlots, bookedSlots: bookedTimes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
