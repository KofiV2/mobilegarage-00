const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const Employee = require('../models/Employee');
const User = require('../models/User');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const employees = await Employee.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedVehicle', 'vehicleNumber licensePlate')
      .sort({ createdAt: -1 });

    res.json({ employees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId')
      .populate('assignedVehicle');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
router.post('/', adminAuth, async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('userId');

    res.status(201).json({ employee: populatedEmployee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update employee
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload face recognition data
router.post('/:id/face-recognition', adminAuth, upload.single('faceImage'), async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    employee.faceDescriptor = JSON.parse(faceDescriptor);
    employee.faceImageUrl = req.file ? req.file.path : null;
    await employee.save();

    res.json({ message: 'Face recognition data uploaded', employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee performance stats
router.get('/:id/performance', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Get additional stats from bookings
    const Booking = require('../models/Booking');
    const completedJobs = await Booking.countDocuments({
      assignedTo: employee._id,
      status: 'completed'
    });

    const avgRating = await Booking.aggregate([
      { $match: { assignedTo: employee._id, 'rating.score': { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating.score' } } }
    ]);

    const performance = {
      ...employee.performance.toObject(),
      completedJobs,
      averageRating: avgRating.length > 0 ? avgRating[0].avgRating : 0
    };

    res.json({ performance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Terminate employee
router.post('/:id/terminate', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    employee.isActive = false;
    employee.terminationDate = new Date();
    employee.terminationReason = reason;
    await employee.save();

    res.json({ message: 'Employee terminated', employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
