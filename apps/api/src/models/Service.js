const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    comment: 'Duration in minutes'
  },
  category: {
    type: String,
    enum: ['basic', 'premium', 'deluxe', 'specialty'],
    default: 'basic'
  },
  vehicleTypes: [{
    type: {
      type: String,
      enum: ['sedan', 'suv', 'truck', 'van', 'coupe', 'hatchback', 'motorcycle']
    },
    priceModifier: {
      type: Number,
      default: 0,
      comment: 'Additional price for this vehicle type'
    }
  }],
  features: [{
    type: String
  }],
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
