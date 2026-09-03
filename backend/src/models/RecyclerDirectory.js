const mongoose = require('mongoose');

const RecyclerDirectorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide recycler facility name'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    acceptedMaterials: [
      {
        type: String,
        trim: true,
      },
    ],
    address: {
      type: String,
      required: true,
      trim: true,
    },
    wardName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    operatingHours: {
      type: String,
      default: 'Mon - Sat: 9:00 AM - 6:00 PM',
    },
    ratesPerKg: {
      type: Map,
      of: Number,
      description: 'Optional indicative scrap purchase rate in INR per kg',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

RecyclerDirectorySchema.index({ location: '2dsphere' });
RecyclerDirectorySchema.index({ acceptedMaterials: 1 });

module.exports = mongoose.model('RecyclerDirectory', RecyclerDirectorySchema);
