const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
    },
    fillPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rawDistanceCm: {
      type: Number,
      required: true,
    },
    weightKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    temperatureC: {
      type: Number,
      default: 20,
    },
    batteryPercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for querying specific bin time-series telemetry
SensorReadingSchema.index({ binId: 1, recordedAt: -1 });

module.exports = mongoose.model('SensorReading', SensorReadingSchema);
