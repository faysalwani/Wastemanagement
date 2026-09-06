const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'PROXIMITY_ALERT',
        'REQUEST_UPDATE',
        'REPORT_VERIFIED',
        'REPORT_RESOLVED',
        'CREDIT_AWARD',
        'SYSTEM_BROADCAST',
        'COLLECTION_REMINDER',
        'VEHICLE_NEARBY',
        'REPORT_STATUS_CHANGED',
        'COLLECTION_REQUEST_UPDATED',
        'EVENT_REQUEST_UPDATED',
        'MARKETPLACE_ORDER_UPDATED',
        'ECO_CREDIT_EARNED',
        'ECO_CREDIT_REDEEMED',
        'SYSTEM_NOTIFICATION',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    createdAt: {
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

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
