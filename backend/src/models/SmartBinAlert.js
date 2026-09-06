const mongoose = require('mongoose');

const SmartBinAlertSchema = new mongoose.Schema(
  {
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartBin',
      required: true,
      index: true,
    },
    binIdentifier: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    wardName: {
      type: String,
      required: true,
    },
    alertType: {
      type: String,
      enum: [
        'FILL_THRESHOLD_EXCEEDED',
        'DEVICE_OFFLINE',
        'ABNORMAL_SENSOR',
        'TEMPERATURE_WARNING',
        'RAPID_FILL',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    currentFillPercent: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'ACTIVE',
      index: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

SmartBinAlertSchema.index({ binIdentifier: 1, alertType: 1, status: 1 });

module.exports = mongoose.model('SmartBinAlert', SmartBinAlertSchema);
