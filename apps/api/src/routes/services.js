const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const Service = require('../models/Service');

const router = express.Router();

// Get all active services
router.get('/', async (req, res) => {
  try {
    const { category, sortBy = 'popularity' } = req.query;
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    const sortOptions = {
      popularity: { popularity: -1 },
      price_asc: { basePrice: 1 },
      price_desc: { basePrice: -1 },
      name: { name: 1 }
    };

    const services = await Service.find(filter)
      .sort(sortOptions[sortBy] || sortOptions.popularity);

    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create service (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update service (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete service (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ message: 'Service deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate price for vehicle type
router.post('/:id/calculate-price', async (req, res) => {
  try {
    const { vehicleType } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    let price = service.basePrice;
    const vehicleTypeConfig = service.vehicleTypes.find(vt => vt.type === vehicleType);

    if (vehicleTypeConfig) {
      price += vehicleTypeConfig.priceModifier;
    }

    res.json({ price, basePrice: service.basePrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
