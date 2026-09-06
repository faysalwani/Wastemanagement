const mongoose = require('mongoose');
const crypto = require('crypto');

const SmartBinSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: [true, 'Please provide a unique Smart Bin ID'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a descriptive bin name'],
      trim: true,
    },
    wardName: {
      type: String,
      required: [true, 'Please assign a Srinagar ward name'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: 'Srinagar, J&K',
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
    capacityLiters: {
      type: Number,
      default: 240,
    },
    depthCm: {
      type: Number,
      default: 100,
      description: 'Physical depth in cm for ultrasonic fill percentage calculation',
    },
    tareWeightKg: {
      type: Number,
      default: 5.0,
      description: 'Base weight of empty bin enclosure',
    },
    fillThresholds: {
      warning: {
        type: Number,
        default: 50,
        min: 10,
        max: 90,
      },
      urgent: {
        type: Number,
        default: 80,
        min: 20,
        max: 99,
      },
    },
    currentFillPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    currentWeightKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentTemperatureC: {
      type: Number,
      default: 20,
    },
    batteryPercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['NORMAL', 'WARNING', 'URGENT', 'STALE', 'OFFLINE'],
      default: 'NORMAL',
    },
    lastCollectedAt: {
      type: Date,
      default: null,
      description: 'Timestamp of the most recent physical waste collection sweep',
    },
    deviceToken: {
      type: String,
      select: false,
    },
    deviceTokenHash: {
      type: String,
      select: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for route optimization and proximity queries
SmartBinSchema.index({ location: '2dsphere' });
SmartBinSchema.index({ status: 1 });
SmartBinSchema.index({ wardName: 1 });

// Helper to generate a new crypto device token for the ESP32
SmartBinSchema.methods.generateDeviceToken = function () {
  const rawToken = crypto.randomBytes(24).toString('hex');
  this.deviceToken = rawToken;
  this.deviceTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return rawToken;
};

// Static helper to verify incoming X-Device-Token
SmartBinSchema.statics.verifyDeviceToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// Instance method to compute fill percentage from raw ultrasonic distance
SmartBinSchema.methods.calculateFillFromDistance = function (distanceCm) {
  if (distanceCm < 0) return 100;
  if (distanceCm >= this.depthCm) return 0;
  const fill = ((this.depthCm - distanceCm) / this.depthCm) * 100;
  return Math.round(Math.max(0, Math.min(100, fill)));
};

// Instance method to determine operational status
SmartBinSchema.methods.updateOperationalStatus = function () {
  if (this.currentFillPercent >= this.fillThresholds.urgent) {
    this.status = 'URGENT';
  } else if (this.currentFillPercent >= this.fillThresholds.warning) {
    this.status = 'WARNING';
  } else {
    this.status = 'NORMAL';
  }
};

module.exports = mongoose.model('SmartBin', SmartBinSchema);
