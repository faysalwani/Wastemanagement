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
    // Password is required ONLY for CITIZEN accounts
    password: {
      type: String,
      required: function () {
        return this.role === 'CITIZEN';
      },
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
    // Citizen ~30-day periodic verification timestamp
    lastOtpVerifiedAt: {
      type: Date,
      default: Date.now,
    },
    // Token Version: Incremented on role change or password reset to invalidate active JWTs
    tokenVersion: {
      type: Number,
      default: 0,
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
    // Password Reset Fields (Citizen only)
    resetPasswordOtpHash: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
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

// Pre-save hook: Hash password with bcrypt before persisting (if present and modified)
UserSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: Verify entered password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

// Instance method: Generate signed JWT token with role-enforced expiration
UserSchema.methods.generateAuthToken = function () {
  // Role-based expiration lifetime
  let expiresIn = '28d'; // CITIZEN: 28 days
  if (this.role === 'SUPER_ADMIN') {
    expiresIn = '7d'; // SUPER_ADMIN: 7 days
  } else if (this.role === 'ADMIN') {
    expiresIn = '14d'; // ADMIN: 14 days
  } else if (this.role === 'DRIVER') {
    expiresIn = '21d'; // DRIVER: 21 days
  }

  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      wardName: this.wardName,
      tokenVersion: this.tokenVersion || 0,
    },
    process.env.JWT_SECRET || 'super_secret_jwt_key_srinagar_smart_waste_2026_msc_ai',
    {
      expiresIn,
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
