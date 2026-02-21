const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: String,
  email: { type: String, required: true },
  phone: String,
  address: String,
  website: String,
  industry: String,
  notes: String,
  dealValue: Number,
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Onboarding', 'Completed', 'Churned'],
    default: 'Active'
  },
  source: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  portalUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema);
