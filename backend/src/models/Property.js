const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'USA',
    },
  },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'condo', 'townhouse', 'duplex', 'studio', 'other'],
    required: [true, 'Property type is required'],
  },
  bedrooms: {
    type: Number,
    min: [0, 'Bedrooms cannot be negative'],
    max: [20, 'Bedrooms cannot be more than 20'],
  },
  bathrooms: {
    type: Number,
    min: [0, 'Bathrooms cannot be negative'],
    max: [20, 'Bathrooms cannot be more than 20'],
  },
  squareFootage: {
    type: Number,
    min: [0, 'Square footage cannot be negative'],
  },
  yearBuilt: {
    type: Number,
    min: [1800, 'Year built cannot be before 1800'],
    max: [new Date().getFullYear() + 1, 'Year built cannot be in the future'],
  },
  amenities: [{
    type: String,
    trim: true,
  }],
  parkingSpaces: {
    type: Number,
    min: [0, 'Parking spaces cannot be negative'],
    default: 0,
  },
  petPolicy: {
    allowed: {
      type: Boolean,
      default: false,
    },
    deposit: Number,
    restrictions: String,
  },
  utilities: {
    included: [{
      type: String,
      enum: ['water', 'electricity', 'gas', 'internet', 'cable', 'trash', 'sewer'],
    }],
    notes: String,
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters'],
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Virtual for full address
propertySchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Index for searching
propertySchema.index({ 'address.city': 1, 'address.state': 1 });
propertySchema.index({ propertyType: 1, bedrooms: 1, bathrooms: 1 });
propertySchema.index({ realtor: 1 });

module.exports = mongoose.model('Property', propertySchema);
