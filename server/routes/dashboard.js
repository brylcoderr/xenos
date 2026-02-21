const express = require('express');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const [
      leads,
      clients,
      projects,
      invoices,
      activities
    ] = await Promise.all([
      Lead.find(),
      Client.find(),
      Project.find(),
      Invoice.find(),
      Activity.find().sort({ createdAt: -1 }).limit(20)
    ]);

    const leadStats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => ['Contacted', 'Replied', 'Call Booked', 'Proposal Sent'].includes(l.status)).length,
      closed: leads.filter(l => l.status === 'Closed').length,
      revenue: leads.filter(l => l.status === 'Closed').reduce((sum, l) => sum + (l.value || 0), 0)
    };

    const clientStats = {
      total: clients.length,
      active: clients.filter(c => c.status === 'Active').length,
      onboarding: clients.filter(c => c.status === 'Onboarding').length,
      completed: clients.filter(c => c.status === 'Completed').length
    };

    const projectStats = {
      total: projects.length,
      active: projects.filter(p => !['Completed', 'Handoff'].includes(p.status)).length,
      completed: projects.filter(p => p.status === 'Completed').length,
      avgProgress: Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / (projects.length || 1))
    };

    const invoiceStats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'Paid').length,
      pending: invoices.filter(i => ['Pending', 'Sent'].includes(i.status)).length,
      overdue: invoices.filter(i => i.status === 'Overdue').length,
      paidAmount: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total || 0), 0),
      pendingAmount: invoices.filter(i => ['Pending', 'Sent'].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0)
    };

    res.json({
      leads: leadStats,
      clients: clientStats,
      projects: projectStats,
      invoices: invoiceStats,
      recentActivity: activities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/activity', auth, async (req, res) => {
  try {
    const { type, entityType, limit = 20 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (entityType) query.entityType = entityType;

    const activities = await Activity.find(query)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/upcoming', auth, async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [followUps, upcomingInvoices, upcomingMilestones] = await Promise.all([
      Lead.find({
        followupDate: { $gte: today, $lte: nextWeek },
        status: { $nin: ['Closed', 'Rejected'] }
      }).populate('assignedTo', 'name').limit(10),

      Invoice.find({
        dueDate: { $gte: today, $lte: nextWeek },
        status: { $nin: ['Paid', 'Cancelled'] }
      }).populate('client', 'name company').limit(10),

      Project.find({
        'milestones.dueDate': { $gte: today, $lte: nextWeek },
        'milestones.status': { $ne: 'completed' }
      }).populate('client', 'name').limit(10)
    ]);

    res.json({
      followUps,
      upcomingInvoices,
      upcomingMilestones
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
