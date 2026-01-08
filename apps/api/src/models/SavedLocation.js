const mongoose = require('mongoose');

const savedLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['home', 'work', 'gym', 'mall', 'friend', 'other'],
    required: true
  },
  emirate: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  isDefault: {
    type: Boolean,
    default: false
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

// Ensure only one default location per user
savedLocationSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('SavedLocation').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Update the updatedAt timestamp on save
savedLocationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SavedLocation', savedLocationSchema);
