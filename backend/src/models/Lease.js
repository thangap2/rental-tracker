const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property is required'],
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, 'Tenant is required'],
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, 'Landlord is required'],
  },
  startDate: {
    type: Date,
    required: [true, 'Lease start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'Lease end date is required'],
  },
  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required'],
    min: [0, 'Monthly rent cannot be negative'],
  },
  securityDeposit: {
    type: Number,
    min: [0, 'Security deposit cannot be negative'],
    default: 0,
  },
  leaseType: {
    type: String,
    enum: ['fixed', 'month-to-month', 'yearly'],
    required: [true, 'Lease type is required'],
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'terminated', 'pending'],
    default: 'pending',
  },
  renewalOption: {
    type: Boolean,
    default: false,
  },
  autoRenewal: {
    type: Boolean,
    default: false,
  },
  noticeRequired: {
    type: Number, // days
    default: 30,
  },
  additionalTerms: {
    type: String,
    maxlength: [2000, 'Additional terms cannot be more than 2000 characters'],
  },
  documents: [{
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  }],
  payments: [{
    amount: Number,
    dueDate: Date,
    paidDate: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'late', 'partial'],
      default: 'pending',
    },
    notes: String,
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['renewal', 'expiration', 'payment', 'inspection'],
    },
    date: Date,
    sent: {
      type: Boolean,
      default: false,
    },
    message: String,
  }],
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Virtual for lease duration in days
leaseSchema.virtual('durationDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days until expiration
leaseSchema.virtual('daysUntilExpiration').get(function() {
  const today = new Date();
  return Math.ceil((this.endDate - today) / (1000 * 60 * 60 * 24));
});

// Virtual for lease status based on dates
leaseSchema.virtual('currentStatus').get(function() {
  const today = new Date();
  if (today < this.startDate) return 'pending';
  if (today > this.endDate) return 'expired';
  return 'active';
});

// Pre-save middleware to update status based on dates
leaseSchema.pre('save', function(next) {
  const today = new Date();
  if (today < this.startDate) {
    this.status = 'pending';
  } else if (today > this.endDate && this.status !== 'terminated') {
    this.status = 'expired';
  } else if (today >= this.startDate && today <= this.endDate && this.status === 'pending') {
    this.status = 'active';
  }
  next();
});

// Index for searching and performance
leaseSchema.index({ startDate: 1, endDate: 1 });
leaseSchema.index({ status: 1 });
leaseSchema.index({ realtor: 1 });
leaseSchema.index({ property: 1, tenant: 1 });

module.exports = mongoose.model('Lease', leaseSchema);
