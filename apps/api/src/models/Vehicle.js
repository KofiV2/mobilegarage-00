const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'truck', 'van', 'coupe', 'hatchback', 'motorcycle'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one default vehicle per user
vehicleSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('Vehicle').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
