const express = require('express');
const router = express.Router();
const DailyTask = require('../models/DailyTask');
const { auth: protect } = require('../middleware/auth');

// Get all daily tasks for the current user
router.get('/', protect, async (req, res) => {
  try {
    const { date } = req.query;
    let query = { user: req.user._id };
    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const tasks = await DailyTask.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new daily task
router.post('/', protect, async (req, res) => {
  try {
    const task = new DailyTask({
      ...req.body,
      user: req.user._id
    });
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a daily task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await DailyTask.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a daily task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await DailyTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
