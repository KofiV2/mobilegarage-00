const express = require('express');
const { auth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Get user's vehicles
router.get('/', auth, async (req, res) => {
  try {
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('user_id', req.userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ vehicles: vehicles || [] });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get vehicle by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      throw error;
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new vehicle
router.post('/', auth, async (req, res) => {
  try {
    const vehicleData = {
      user_id: req.userId,
      make: req.body.make,
      model: req.body.model,
      year: req.body.year,
      color: req.body.color,
      license_plate: req.body.licensePlate || req.body.license_plate,
      type: req.body.type,
      is_default: req.body.isDefault || req.body.is_default || false,
      notes: req.body.notes
    };

    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ vehicle });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = {};

    // Map camelCase to snake_case
    if (req.body.make) updateData.make = req.body.make;
    if (req.body.model) updateData.model = req.body.model;
    if (req.body.year) updateData.year = req.body.year;
    if (req.body.color) updateData.color = req.body.color;
    if (req.body.licensePlate || req.body.license_plate) {
      updateData.license_plate = req.body.licensePlate || req.body.license_plate;
    }
    if (req.body.type) updateData.type = req.body.type;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.isDefault !== undefined || req.body.is_default !== undefined) {
      updateData.is_default = req.body.isDefault || req.body.is_default;
    }

    updateData.updated_at = new Date().toISOString();

    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      throw error;
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete vehicle
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      throw error;
    }

    res.json({ message: 'Vehicle deleted successfully', vehicle });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set default vehicle
router.patch('/:id/set-default', auth, async (req, res) => {
  try {
    // First, unset all default vehicles for this user
    await supabaseAdmin
      .from('vehicles')
      .update({ is_default: false })
      .eq('user_id', req.userId);

    // Then set the requested vehicle as default
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      throw error;
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Error setting default vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
