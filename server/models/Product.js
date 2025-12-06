const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  dongvanfb_id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Mail Facebook Verify'
  },
  dongvanfb_price: {
    type: Number,
    required: true,
    min: 0
  },
  selling_price: {
    type: Number,
    required: true,
    min: 0
  },
  profit_margin: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  min_quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  max_quantity: {
    type: Number,
    default: 100
  },
  is_active: {
    type: Boolean,
    default: true
  },
  total_sold: {
    type: Number,
    default: 0
  },
  last_synced: {
    type: Date,
    default: null
  },
  format: {
    type: String,
    default: 'mail|password|token'
  },
  features: [{
    type: String
  }],
  sort_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

ProductSchema.pre('save', function(next) {
  if (this.dongvanfb_price > 0) {
    this.profit_margin = ((this.selling_price - this.dongvanfb_price) / this.dongvanfb_price * 100).toFixed(2);
  }
  next();
});

ProductSchema.virtual('stock_status').get(function() {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock < 10) return 'low_stock';
  return 'in_stock';
});

ProductSchema.virtual('profit_per_unit').get(function() {
  return this.selling_price - this.dongvanfb_price;
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

ProductSchema.statics.getActiveProducts = async function() {
  return this.find({ is_active: true, stock: { $gt: 0 } })
    .select('-dongvanfb_price -profit_margin')
    .sort({ sort_order: 1, name: 1 });
};

ProductSchema.statics.getAdminProducts = async function() {
  return this.find().sort({ sort_order: 1, name: 1 });
};

module.exports = mongoose.model('Product', ProductSchema);