const mongoose = require('mongoose');

const EcoCreditTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        'SOURCE_SEGREGATION',
        'RESOURCE_EXCHANGE',
        'VERIFIED_DUMPING_REPORT',
        'RECYCLING_DROP_OFF',
        'ADMIN_ADJUSTMENT',
        'COMPOSTING_ACTIVITY',
        'MARKETPLACE_REDEMPTION',
        'REDEMPTION_REFUND',
      ],
      required: true,
    },
    creditsEarned: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      default: function () {
        return this.creditsEarned;
      },
    },
    referenceType: {
      type: String,
      enum: ['COMPOST', 'REPORT', 'EXCHANGE', 'ORDER', 'ADMIN', 'OTHER'],
      default: 'OTHER',
    },
    referenceId: {
      type: String,
      description: 'Foreign key to report, exchange, or bin reading',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      description: 'Unique compound token preventing double crediting: activity_refId_userId',
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

EcoCreditTransactionSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('EcoCreditTransaction', EcoCreditTransactionSchema);
