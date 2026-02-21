const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  dueDate: Date,
  completedAt: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const milestoneSchema = new mongoose.Schema({
  name: String,
  description: String,
  dueDate: Date,
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  completedAt: Date
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  status: { 
    type: String, 
    enum: ['Lead', 'Proposal', 'Agreement', 'Onboarding', 'Development', 'Delivery', 'Handoff', 'Completed'],
    default: 'Lead'
  },
  startDate: Date,
  endDate: Date,
  budget: Number,
  progress: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tasks: [taskSchema],
  milestones: [milestoneSchema],
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
  timeline: {
    phases: [{
      name: String,
      status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
      startDate: Date,
      endDate: Date,
      tasks: [taskSchema]
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.methods.calculateProgress = function() {
  if (!this.tasks.length) return 0;
  const completed = this.tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / this.tasks.length) * 100);
};

module.exports = mongoose.model('Project', projectSchema);
