const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const OrderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order_number: {
    type: String,
    unique: true,
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  dongvanfb_product_id: {
    type: Number,
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price_per_unit: {
    type: Number,
    required: true
  },
  cost_per_unit: {
    type: Number,
    required: true
  },
  total_price: {
    type: Number,
    required: true
  },
  total_cost: {
    type: Number,
    required: true
  },
  profit: {
    type: Number,
    required: true
  },
  credentials: {
    type: String,
    default: null
  },
  credentials_encrypted: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partial'],
    default: 'pending'
  },
  dongvanfb_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    select: false
  },
  error_message: {
    type: String,
    default: null
  },
  refund_reason: {
    type: String,
    default: null
  },
  refunded_at: {
    type: Date,
    default: null
  },
  refunded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

OrderSchema.pre('save', async function(next) {
  if (!this.order_number) {
    const date = new Date();
    const prefix = 'ORD';
    const timestamp = date.getFullYear().toString().slice(-2) + 
                     (date.getMonth() + 1).toString().padStart(2, '0') +
                     date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.order_number = prefix + '-' + timestamp + '-' + random;
  }
  next();
});

OrderSchema.methods.encryptCredentials = function(credentials) {
  const encrypted = CryptoJS.AES.encrypt(
    credentials, 
    process.env.ENCRYPTION_KEY || 'default-encryption-key'
  ).toString();
  this.credentials = encrypted;
  this.credentials_encrypted = true;
  return encrypted;
};

OrderSchema.methods.decryptCredentials = function() {
  if (!this.credentials) return null;
  if (!this.credentials_encrypted) return this.credentials;
  
  try {
    const bytes = CryptoJS.AES.decrypt(
      this.credentials, 
      process.env.ENCRYPTION_KEY || 'default-encryption-key'
    );
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

OrderSchema.statics.getStats = async function(userId = null) {
  const match = userId ? { user_id: mongoose.Types.ObjectId(userId) } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total_orders: { $sum: 1 },
        total_spent: { $sum: '$total_price' },
        total_profit: { $sum: '$profit' },
        completed_orders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || { total_orders: 0, total_spent: 0, total_profit: 0, completed_orders: 0 };
};

module.exports = mongoose.model('Order', OrderSchema);