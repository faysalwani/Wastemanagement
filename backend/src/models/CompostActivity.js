const mongoose = require('mongoose');

const CompostActivitySchema = new mongoose.Schema(
  {
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wasteType: {
      type: String,
      enum: [
        'VEGETABLE_SCRAPS',
        'FRUIT_WASTE',
        'FOOD_SCRAPS',
        'GARDEN_PLANT_WASTE',
        'LEAVES_CHINAR',
        'COFFEE_TEA_WASTE',
        'OTHER_BIODEGRADABLE',
      ],
      required: [true, 'Please select an organic waste category'],
    },
    quantityKg: {
      type: Number,
      required: [true, 'Please enter quantity in kilograms'],
      min: [0.1, 'Quantity must be at least 0.1 kg'],
      max: [200, 'Batch quantity cannot exceed 200 kg for household composting'],
    },
    brownMaterialType: {
      type: String,
      default: 'Dry Chinar Leaves & Shredded Cardboard',
      trim: true,
    },
    brownQuantityKg: {
      type: Number,
      default: 0,
      min: [0, 'Brown material quantity cannot be negative'],
    },
    method: {
      type: String,
      enum: ['HOME_BIN', 'VERMICOMPOSTING', 'OUTDOOR_PILE', 'COMMUNITY_TUMBLER'],
      default: 'HOME_BIN',
    },
    status: {
      type: String,
      enum: ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'STARTED',
      index: true,
    },
    estimatedMaturityWeeks: {
      type: Number,
      default: 8,
    },
    estimatedMaturityDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    ecoCreditsAwarded: {
      type: Boolean,
      default: false,
    },
    recommendation: {
      isSuitable: { type: Boolean, default: true },
      method: { type: String },
      preparation: { type: String },
      mixRatio: { type: String },
      moistureGuidance: { type: String },
      turningGuidance: { type: String },
      processTimeline: { type: String },
      thingsToAvoid: [{ type: String }],
      readinessIndicators: { type: String },
      troubleshooting: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

CompostActivitySchema.index({ citizenId: 1, createdAt: -1 });

module.exports = mongoose.model('CompostActivity', CompostActivitySchema);
