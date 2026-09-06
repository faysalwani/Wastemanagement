const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    vehicleId: {
      type: String,
      trim: true,
      uppercase: true,
    },
    plateNumber: {
      type: String,
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
    vehicleType: {
      type: String,
      enum: ['MINI_COMPACTOR', 'TIPPER_TRUCK', 'ELECTRIC_LOADER', 'HEAVY_COMPACTOR'],
      default: 'MINI_COMPACTOR',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_ROUTE', 'COLLECTING', 'MAINTENANCE', 'OFFLINE'],
      default: 'AVAILABLE',
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

VehicleSchema.pre('save', function (next) {
  if (!this.vehicleNumber && this.vehicleId) this.vehicleNumber = this.vehicleId;
  if (!this.vehicleId && this.vehicleNumber) this.vehicleId = this.vehicleNumber;
  if (!this.plateNumber && this.vehicleNumber) this.plateNumber = this.vehicleNumber;
  next();
});

VehicleSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Vehicle', VehicleSchema);
