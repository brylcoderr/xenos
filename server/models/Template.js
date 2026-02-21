const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'Client Agreement', 
      'Welcome Document', 
      'Invoice', 
      'Client Portal Guide', 
      'Project Timeline', 
      'Fulfilment Checklist', 
      'Content Usage Guide', 
      'Monthly Report', 
      'Competition Analysis', 
      'Thank You Document', 
      'Thank You Package',
      'Proposal Template',
      'Internal Resource',
      'Custom'
    ],
    required: true
  },
  content: String,
  htmlContent: String,
  variables: [String],
  defaultVariables: mongoose.Schema.Types.Mixed,
  header: String,
  footer: String,
  logo: String,
  primaryColor: { type: String, default: '#9b7cff' },
  accentColor: { type: String, default: '#39e97b' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  category: String,
  description: String,
  usageCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', templateSchema);
