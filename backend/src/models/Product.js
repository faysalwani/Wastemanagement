const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: [
        'DUSTBINS',
        'COMPOSTING_KITS',
        'REUSABLE_BAGS',
        'SEGREGATION_BINS',
        'RECYCLING_ACCESSORIES',
        'GARDENING',
        'ECO_HOUSEHOLD',
      ],
      required: [true, 'Please select product category'],
      index: true,
    },
    moneyPrice: {
      type: Number,
      required: [true, 'Please specify money price (INR)'],
      min: [0, 'Money price cannot be negative'],
    },
    ecoCreditPrice: {
      type: Number,
      required: [true, 'Please specify Eco-Credit redemption price'],
      min: [0, 'Eco-Credit price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Please specify available stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'],
      default: 'ACTIVE',
      index: true,
    },
    vendor: {
      type: String,
      trim: true,
      default: 'EcoCycle Municipal Cooperative',
    },
  },
  {
    timestamps: true,
  }
);

// Automatically update status based on stock
ProductSchema.pre('save', function (next) {
  if (this.stock === 0 && this.status === 'ACTIVE') {
    this.status = 'OUT_OF_STOCK';
  } else if (this.stock > 0 && this.status === 'OUT_OF_STOCK') {
    this.status = 'ACTIVE';
  }
  next();
});

ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
