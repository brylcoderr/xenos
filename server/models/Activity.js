const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: [
      'lead_created', 'lead_updated', 'lead_status_changed', 'lead_deleted',
      'client_created', 'client_updated',
      'project_created', 'project_updated', 'project_status_changed',
      'document_created', 'document_updated', 'document_deleted', 'document_sent', 'document_signed',
      'invoice_created', 'invoice_sent', 'invoice_paid',
      'task_completed', 'milestone_completed',
      'user_login', 'user_logout'
    ],
    required: true
  },
  description: String,
  entityType: { type: String, enum: ['lead', 'client', 'project', 'document', 'invoice', 'user'] },
  entityId: mongoose.Schema.Types.ObjectId,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Activity', activitySchema);
