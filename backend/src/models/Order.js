const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    ecoCreditPrice: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    totalMoney: {
      type: Number,
      default: 0,
    },
    totalEcoCredits: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [OrderItemSchema],
    paymentMethod: {
      type: String,
      enum: ['MONEY', 'ECO_CREDITS'],
      required: true,
    },
    moneyAmount: {
      type: Number,
      default: 0,
    },
    ecoCreditAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'CONFIRMED',
      index: true,
    },
    shippingAddress: {
      street: { type: String, required: true, trim: true },
      wardName: { type: String, required: true, trim: true },
      city: { type: String, default: 'Srinagar' },
      contactPhone: { type: String, required: true, trim: true },
      notes: { type: String, trim: true },
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
