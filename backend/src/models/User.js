const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['CITIZEN', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'CITIZEN',
    },
    phone: {
      type: String,
      trim: true,
    },
    wardName: {
      type: String,
      default: 'Lal Chowk',
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: 'Srinagar, Jammu & Kashmir',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [74.7973, 34.0837], // Srinagar central coordinates
      },
    },
    ecoCredits: {
      type: Number,
      default: 0,
      min: [0, 'Eco-credits cannot be negative'],
    },
    tier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'ECO_CHAMPION'],
      default: 'BRONZE',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // OTP Security Fields
    otpHash: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    otpCooldownUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for proximity calculations
UserSchema.index({ location: '2dsphere' });

// Pre-save hook: Hash password with bcrypt before persisting
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: Verify entered password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Instance method: Generate signed JWT token
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      wardName: this.wardName,
    },
    process.env.JWT_SECRET || 'secret_fallback_key',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

// Instance method: Recalculate reward tier based on eco-credits
UserSchema.methods.updateTier = function () {
  if (this.ecoCredits >= 500) {
    this.tier = 'ECO_CHAMPION';
  } else if (this.ecoCredits >= 250) {
    this.tier = 'GOLD';
  } else if (this.ecoCredits >= 100) {
    this.tier = 'SILVER';
  } else {
    this.tier = 'BRONZE';
  }
};

module.exports = mongoose.model('User', UserSchema);
