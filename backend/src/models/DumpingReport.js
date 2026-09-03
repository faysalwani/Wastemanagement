const mongoose = require('mongoose');

const DumpingReportSchema = new mongoose.Schema(
  {
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    photoUrl: {
      type: String,
      required: [true, 'Please provide photo evidence of dumping'],
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
    address: {
      type: String,
      trim: true,
    },
    wardName: {
      type: String,
      required: [true, 'Please specify the Srinagar ward'],
      trim: true,
    },
    wasteCategory: {
      type: String,
      enum: ['PLASTIC', 'ORGANIC', 'CONSTRUCTION', 'MIXED_DUMP', 'HAZARDOUS', 'OTHER'],
      default: 'MIXED_DUMP',
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'VERIFIED',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED',
        'REJECTED',
      ],
      default: 'SUBMITTED',
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    resolutionPhotoUrl: {
      type: String,
    },
    ecoCreditsAwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for GIS mapping and spatial clustering
DumpingReportSchema.index({ location: '2dsphere' });
DumpingReportSchema.index({ status: 1 });
DumpingReportSchema.index({ wardName: 1 });

module.exports = mongoose.model('DumpingReport', DumpingReportSchema);
