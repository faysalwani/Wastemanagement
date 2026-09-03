const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    wardName: {
      type: String,
      default: 'Lal Chowk',
    },
    address: {
      type: String,
      default: 'Srinagar, Jammu & Kashmir',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [74.7973, 34.0837],
      },
    },
    otpHash: {
      type: String,
      required: true,
    },
    otpExpires: {
      type: Date,
      required: true,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpCooldownUntil: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // 30-minute auto-purge TTL
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('PendingRegistration', PendingRegistrationSchema);
