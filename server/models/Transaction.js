const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction_id: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'purchase', 'refund', 'admin_credit', 'admin_debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance_before: {
    type: Number,
    required: true
  },
  balance_after: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    enum: ['nowpayments', 'admin', 'system'],
    default: 'system'
  },
  payment_id: {
    type: String,
    default: null
  },
  crypto_type: {
    type: String,
    default: null
  },
  crypto_amount: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'waiting', 'confirming', 'completed', 'failed', 'expired'],
    default: 'pending'
  },
  related_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  admin_note: {
    type: String,
    default: null
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  nowpayments_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    select: false
  },
  ip_address: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

TransactionSchema.pre('save', async function(next) {
  if (!this.transaction_id) {
    const prefix = 'TXN';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.transaction_id = prefix + timestamp + random;
  }
  next();
});

TransactionSchema.statics.getUserHistory = async function(userId, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  const transactions = await this.find({ user_id: userId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('related_order_id', 'order_number product_name');
  const total = await this.countDocuments({ user_id: userId });
  return { transactions, total, pages: Math.ceil(total / limit), current_page: page };
};

module.exports = mongoose.model('Transaction', TransactionSchema);