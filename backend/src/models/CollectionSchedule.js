const mongoose = require('mongoose');

const CollectionScheduleSchema = new mongoose.Schema(
  {
    wardName: {
      type: String,
      required: [true, 'Ward name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['ORGANIC', 'RECYCLABLE', 'HAZARDOUS', 'BULK_RESIDUAL', 'MIXED'],
      default: 'MIXED',
    },
    collectionDays: {
      type: [String],
      enum: [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ],
      default: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    },
    timeWindow: {
      start: { type: String, default: '07:00' },
      end: { type: String, default: '11:00' },
    },
    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    frequencyDescription: {
      type: String,
      default: 'Bi-daily Morning Sweep',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CollectionScheduleSchema.index({ wardName: 1, isActive: 1 });

module.exports = mongoose.model('CollectionSchedule', CollectionScheduleSchema);
