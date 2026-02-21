const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  completed: { type: Boolean, default: false },
  category: { type: String, enum: ['work', 'outreach', 'personal', 'other'], default: 'work' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for getting tasks for a specific date range for a user
dailyTaskSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('DailyTask', dailyTaskSchema);
