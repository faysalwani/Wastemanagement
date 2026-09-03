const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['ROLE_CHANGE', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED'],
      required: true,
    },
    previousValue: {
      type: String,
    },
    newValue: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: 'Administrative modification by Super Administrator',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
