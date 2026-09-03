const mongoose = require('mongoose');

const CollectionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ['ON_DEMAND', 'EVENT'],
      default: 'ON_DEMAND',
    },
    category: {
      type: String,
      enum: ['ORGANIC', 'RECYCLABLE', 'HAZARDOUS', 'BULK_RESIDUAL', 'MIXED'],
      default: 'RECYCLABLE',
    },
    estimatedVolumeKg: {
      type: Number,
      default: 5,
      min: [1, 'Estimated volume must be at least 1 kg'],
    },
    description: {
      type: String,
      trim: true,
    },
    pickupAddress: {
      type: String,
      required: [true, 'Please provide pickup address'],
      trim: true,
    },
    wardName: {
      type: String,
      required: [true, 'Please provide Srinagar ward name'],
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
    eventDetails: {
      eventName: { type: String, trim: true },
      eventDate: { type: Date },
      expectedAttendees: { type: Number },
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'REVIEWED',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    scheduledDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for spatial grouping and route inclusion
CollectionRequestSchema.index({ location: '2dsphere' });
CollectionRequestSchema.index({ status: 1 });
CollectionRequestSchema.index({ wardName: 1 });

module.exports = mongoose.model('CollectionRequest', CollectionRequestSchema);
