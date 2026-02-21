const mongoose = require('mongoose');
const crypto = require('crypto');

const documentSchema = new mongoose.Schema({
  templateType: { 
    type: String, 
    enum: [
      'client-agreement', 
      'welcome-document', 
      'invoice', 
      'client-portal-guide', 
      'project-timeline', 
      'fulfilment-checklist', 
      'content-usage-guide', 
      'monthly-report', 
      'competition-analysis', 
      'thank-you-document', 
      'thank-you-package',
      'proposal-template',
      'internal-resource',
      'custom'
    ],
    default: 'custom'
  },
  title: { type: String, required: true },
  fields: { type: Map, of: String, default: {} },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shareToken: { type: String, default: null },
  isShareEnabled: { type: Boolean, default: false },
  
  // Legacy fields for backward compatibility
  name: { type: String },
  type: { type: String },
  content: String,
  htmlContent: String,
  variables: mongoose.Schema.Types.Mixed,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  isTemplate: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  versions: [{
    version: Number,
    content: String,
    htmlContent: String,
    savedAt: Date,
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  status: { type: String, enum: ['draft', 'sent', 'signed', 'completed'], default: 'draft' },
  signedAt: Date,
  sentAt: Date,
  completedAt: Date,
  fileUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

documentSchema.methods.generateShareToken = function() {
  this.shareToken = crypto.randomUUID();
  this.isShareEnabled = true;
  return this.shareToken;
};

documentSchema.methods.disableShare = function() {
  this.isShareEnabled = false;
  return this;
};

module.exports = mongoose.model('Document', documentSchema);
