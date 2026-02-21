const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  quantity: { type: Number, default: 1 },
  rate: Number,
  amount: Number
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  type: { type: String, enum: ['Deposit', 'Milestone', 'Final', 'Monthly', 'Custom'], default: 'Custom' },
  items: [invoiceItemSchema],
  subtotal: Number,
  tax: Number,
  taxRate: { type: Number, default: 0 },
  total: Number,
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['Draft', 'Pending', 'Sent', 'Viewed', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  dueDate: Date,
  paidDate: Date,
  notes: String,
  paymentMethod: String,
  paymentLink: String,
  stripeCheckoutSessionId: String,
  stripePaymentIntentId: String,
  sentAt: Date,
  viewedAt: Date,
  paidAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

invoiceSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  this.total = this.subtotal + (this.subtotal * (this.taxRate / 100));
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
