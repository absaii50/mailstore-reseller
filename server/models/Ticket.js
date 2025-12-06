const mongoose = require('mongoose');

const TicketMessageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender_role: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

const TicketSchema = new mongoose.Schema({
  ticket_number: {
    type: String,
    unique: true,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['order_issue', 'payment_issue', 'account_issue', 'refund_request', 'general', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_reply', 'resolved', 'closed'],
    default: 'open'
  },
  related_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  messages: [TicketMessageSchema],
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  last_reply_at: {
    type: Date,
    default: null
  },
  last_reply_by: {
    type: String,
    enum: ['user', 'admin'],
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

TicketSchema.pre('save', async function(next) {
  if (!this.ticket_number) {
    const prefix = 'TKT';
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) +
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.ticket_number = prefix + '-' + dateStr + '-' + random;
  }
  next();
});

TicketSchema.methods.addMessage = async function(senderId, senderRole, message, attachments = []) {
  this.messages.push({
    sender_id: senderId,
    sender_role: senderRole,
    message: message,
    attachments: attachments
  });
  this.last_reply_at = new Date();
  this.last_reply_by = senderRole;
  if (senderRole === 'admin') {
    this.status = 'waiting_reply';
  } else {
    this.status = 'open';
  }
  await this.save();
  return this;
};

module.exports = mongoose.model('Ticket', TicketSchema);