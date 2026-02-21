const express = require('express');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const { auth, clientAccess } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const clientsWithStats = await Promise.all(clients.map(async (client) => {
      const projects = await Project.find({ client: client._id });
      const invoices = await Invoice.find({ client: client._id });
      const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total || 0), 0);
      
      return {
        ...client.toObject(),
        projectCount: projects.length,
        invoiceCount: invoices.length,
        totalRevenue
      };
    }));

    res.json({
      clients: clientsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const clients = await Client.find();
    
    const stats = {
      total: clients.length,
      active: clients.filter(c => c.status === 'Active').length,
      onboarding: clients.filter(c => c.status === 'Onboarding').length,
      completed: clients.filter(c => c.status === 'Completed').length,
      churned: clients.filter(c => c.status === 'Churned').length,
      totalRevenue: clients.reduce((sum, c) => sum + (c.dealValue || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('projects')
      .populate('invoices')
      .populate('documents');
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const projects = await Project.find({ client: client._id })
      .populate('owner', 'name')
      .sort({ createdAt: -1 });

    const invoices = await Invoice.find({ client: client._id })
      .sort({ createdAt: -1 });

    res.json({ client, projects, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const client = new Client({
      ...req.body,
      owner: req.user._id
    });
    await client.save();

    await Activity.create({
      type: 'client_created',
      description: `New client created: ${client.name}`,
      user: req.user._id,
      entityType: 'client',
      entityId: client._id
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    await Activity.create({
      type: 'client_updated',
      description: `Client ${client.name} updated`,
      user: req.user._id,
      entityType: 'client',
      entityId: client._id
    });

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
