const mongoose = require('mongoose');

const CollectionStopSchema = new mongoose.Schema({
  stopSequence: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['SMART_BIN', 'COLLECTION_REQUEST', 'SPECIAL_EVENT'],
    required: true,
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  refModel: {
    type: String,
    default: null,
  },
  identifier: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  wardName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: 'Srinagar, J&K',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  fillPercent: {
    type: Number,
    default: 0,
  },
  estimatedWeightKg: {
    type: Number,
    default: 0,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  },
  status: {
    type: String,
    enum: ['PENDING', 'COLLECTED', 'PARTIALLY_COLLECTED', 'SKIPPED', 'UNABLE_TO_COLLECT'],
    default: 'PENDING',
  },
  collectedWeightKg: {
    type: Number,
    default: null,
  },
  skipReason: {
    type: String,
    enum: [
      'Road inaccessible',
      'Bin unavailable',
      'Vehicle capacity reached',
      'Request cancelled',
      'Location issue',
      'Other',
      null,
    ],
    default: null,
  },
  driverNotes: {
    type: String,
    trim: true,
  },
  completedAt: {
    type: Date,
  },
});

const CollectionRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Assigned vehicle is required'],
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned driver is required'],
      index: true,
    },
    wardName: {
      type: String,
      trim: true,
      default: 'All Wards',
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'ASSIGNED',
      index: true,
    },
    stops: [CollectionStopSchema],
    totalStops: {
      type: Number,
      default: 0,
    },
    completedStops: {
      type: Number,
      default: 0,
    },
    skippedStops: {
      type: Number,
      default: 0,
    },
    totalDistanceKm: {
      type: Number,
      default: 0,
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

CollectionRunSchema.index({ driverId: 1, status: 1 });
CollectionRunSchema.index({ vehicleId: 1, status: 1 });
CollectionRunSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CollectionRun', CollectionRunSchema);
