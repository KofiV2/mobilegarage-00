const express = require('express');
const { auth } = require('../middleware/auth');
const SavedLocation = require('../models/SavedLocation');

const router = express.Router();

// Get user's saved locations
router.get('/', auth, async (req, res) => {
  try {
    const locations = await SavedLocation.find({ userId: req.userId })
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({ locations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get location by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const location = await SavedLocation.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new saved location
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, emirate, area, address, latitude, longitude, isDefault } = req.body;

    // Validate required fields
    if (!name || !type || !emirate) {
      return res.status(400).json({
        error: 'Name, type, and emirate are required'
      });
    }

    const location = new SavedLocation({
      userId: req.userId,
      name,
      type,
      emirate,
      area,
      address,
      latitude,
      longitude,
      isDefault: isDefault || false
    });

    await location.save();
    res.status(201).json({ location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update saved location
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, emirate, area, address, latitude, longitude, isDefault } = req.body;

    const location = await SavedLocation.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Update fields
    if (name !== undefined) location.name = name;
    if (type !== undefined) location.type = type;
    if (emirate !== undefined) location.emirate = emirate;
    if (area !== undefined) location.area = area;
    if (address !== undefined) location.address = address;
    if (latitude !== undefined) location.latitude = latitude;
    if (longitude !== undefined) location.longitude = longitude;
    if (isDefault !== undefined) location.isDefault = isDefault;

    await location.save();
    res.json({ location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete saved location
router.delete('/:id', auth, async (req, res) => {
  try {
    const location = await SavedLocation.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set default location
router.put('/:id/set-default', auth, async (req, res) => {
  try {
    const location = await SavedLocation.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Remove default from all other locations
    await SavedLocation.updateMany(
      { userId: req.userId },
      { isDefault: false }
    );

    // Set this location as default
    location.isDefault = true;
    await location.save();

    res.json({ location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
