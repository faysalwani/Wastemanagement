const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Please provide vehicle registration number'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    model: {
      type: String,
      default: 'Tata Ace Mini Compactor',
      trim: true,
    },
    capacityKg: {
      type: Number,
      default: 1000,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [74.7973, 34.0837], // Srinagar center
      },
    },
    heading: {
      type: Number,
      default: 0,
      description: 'Compass heading in degrees (0-360)',
    },
    speedKmh: {
      type: Number,
      default: 0,
    },
    lastLocationUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

VehicleSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Vehicle', VehicleSchema);
