const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'DEFAULT_REWARD_CONFIG',
    },
    compostingPoints: {
      type: Number,
      default: 20,
      min: 0,
    },
    dumpingReportPoints: {
      type: Number,
      default: 50,
      min: 0,
    },
    recyclingDropOffPoints: {
      type: Number,
      default: 30,
      min: 0,
    },
    resourceExchangePoints: {
      type: Number,
      default: 25,
      min: 0,
    },
    sourceSegregationPoints: {
      type: Number,
      default: 15,
      min: 0,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
