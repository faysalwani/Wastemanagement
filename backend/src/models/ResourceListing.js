const mongoose = require('mongoose');

const ResourceListingSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide listing title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: [
        'ORGANIC_COMPOSTABLE',
        'REUSABLE_CONTAINER',
        'SCRAP_PAPER_CARDBOARD',
        'SCRAP_METAL_GLASS',
        'OTHER',
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify quantity'],
      min: [0.1, 'Quantity must be greater than zero'],
    },
    quantityUnit: {
      type: String,
      enum: ['KG', 'UNITS', 'BAGS', 'LITERS'],
      default: 'KG',
    },
    address: {
      type: String,
      trim: true,
    },
    wardName: {
      type: String,
      required: [true, 'Please specify Srinagar ward'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    photoUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'COMPLETED', 'CANCELLED'],
      default: 'AVAILABLE',
    },
    claimedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    claimedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    version: {
      type: Number,
      default: 1,
      description: 'Optimistic locking concurrency counter',
    },
  },
  {
    timestamps: true,
  }
);

ResourceListingSchema.index({ location: '2dsphere' });
ResourceListingSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('ResourceListing', ResourceListingSchema);
