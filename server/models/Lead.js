const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: String,
  phone: { type: String, required: true },
  email: String,
  website: String,
  biztype: String,
  channel: String,
  source: { type: String, default: 'Manual' },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Replied', 'Call Booked', 'Proposal Sent', 'Closed', 'Rejected', 'Follow Up'],
    default: 'New'
  },
  value: Number,
  notes: String,
  followupDate: Date,
  lastContact: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

leadSchema.index({ name: 'text', company: 'text', phone: 'text', notes: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
