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
      required: false,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'ROLE_CHANGE',
        'ACCOUNT_SUSPENDED',
        'ACCOUNT_REACTIVATED',
        'COLLECTION_REQUEST_UPDATE',
        'ROUTE_DISPATCH',
        'VEHICLE_CREATED',
        'SYSTEM_BOOTSTRAP',
        'PRODUCT_CREATED',
        'PRODUCT_UPDATED',
        'ORDER_STATUS_UPDATED',
        'RECYCLER_CREATED',
        'RECYCLER_UPDATED',
        'REWARD_CONFIG_UPDATED',
        'SMART_BIN_UPDATED',
      ],
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
