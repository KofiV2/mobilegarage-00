const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    enum: ['operations', 'management', 'hr', 'finance', 'maintenance', 'mobile_crew'],
    required: true
  },
  position: {
    type: String,
    required: true
  },
  hireDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['hourly', 'salary', 'commission', 'hybrid'],
    default: 'hourly'
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    default: 0,
    comment: 'Percentage of job value'
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    routingNumber: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  certifications: [{
    name: String,
    issueDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  faceDescriptor: {
    type: Array,
    default: null,
    comment: 'Face recognition data'
  },
  faceImageUrl: {
    type: String,
    default: null
  },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FleetVehicle',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  terminationDate: {
    type: Date,
    default: null
  },
  terminationReason: {
    type: String,
    default: null
  },
  performance: {
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalJobsCompleted: {
      type: Number,
      default: 0
    },
    averageCustomerRating: {
      type: Number,
      default: 0
    },
    punctualityScore: {
      type: Number,
      default: 100
    }
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

employeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
