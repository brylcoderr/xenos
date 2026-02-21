const express = require('express');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, client, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (client) query.client = client;

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('client', 'name company email')
      .populate('owner', 'name email')
      .populate('team', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      projects,
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
    const projects = await Project.find();
    
    const stats = {
      total: projects.length,
      lead: projects.filter(p => p.status === 'Lead').length,
      proposal: projects.filter(p => p.status === 'Proposal').length,
      agreement: projects.filter(p => p.status === 'Agreement').length,
      onboarding: projects.filter(p => p.status === 'Onboarding').length,
      development: projects.filter(p => p.status === 'Development').length,
      delivery: projects.filter(p => p.status === 'Delivery').length,
      handoff: projects.filter(p => p.status === 'Handoff').length,
      completed: projects.filter(p => p.status === 'Completed').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client')
      .populate('owner', 'name email')
      .populate('team', 'name email')
      .populate('documents')
      .populate('invoices');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { clientId, name, description, status, startDate, endDate, budget } = req.body;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const project = new Project({
      name,
      description,
      status: status || 'Lead',
      client: clientId,
      startDate,
      endDate,
      budget,
      owner: req.user._id
    });
    await project.save();

    client.projects.push(project._id);
    await client.save();

    await Activity.create({
      type: 'project_created',
      description: `New project created: ${project.name}`,
      user: req.user._id,
      entityType: 'project',
      entityId: project._id,
      metadata: { clientId, clientName: client.name }
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (req.body.status && req.body.status !== oldProject.status) {
      await Activity.create({
        type: 'project_status_changed',
        description: `Project ${project.name} status changed from ${oldProject.status} to ${req.body.status}`,
        user: req.user._id,
        entityType: 'project',
        entityId: project._id,
        metadata: { oldStatus: oldProject.status, newStatus: req.body.status }
      });
    } else {
      await Activity.create({
        type: 'project_updated',
        description: `Project ${project.name} updated`,
        user: req.user._id,
        entityType: 'project',
        entityId: project._id
      });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const { title, description, dueDate, assignedTo } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.tasks.push({
      title,
      description,
      dueDate,
      assignedTo: assignedTo || req.user._id,
      status: 'pending'
    });

    project.progress = project.calculateProgress();
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/tasks', auth, async (req, res) => {
  try {
    const { tasks } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { tasks, updatedAt: new Date() },
      { new: true }
    );

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const { status, completedAt } = req.body;
    const project = await Project.findById(req.params.id);
    
    const task = project.tasks.id(req.params.taskId);
    if (task) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = completedAt || new Date();
      }
      
      project.progress = project.calculateProgress();
      await project.save();

      await Activity.create({
        type: 'task_completed',
        description: `Task "${task.title}" completed in project ${project.name}`,
        user: req.user._id,
        entityType: 'project',
        entityId: project._id,
        metadata: { taskId: req.params.taskId, taskTitle: task.title }
      });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/milestones/:milestoneId', auth, async (req, res) => {
  try {
    const { status, completedAt } = req.body;
    const project = await Project.findById(req.params.id);
    
    const milestone = project.milestones.id(req.params.milestoneId);
    if (milestone) {
      milestone.status = status;
      if (status === 'completed') {
        milestone.completedAt = completedAt || new Date();
      }
      await project.save();

      await Activity.create({
        type: 'milestone_completed',
        description: `Milestone "${milestone.name}" completed in project ${project.name}`,
        user: req.user._id,
        entityType: 'project',
        entityId: project._id,
        metadata: { milestoneId: req.params.milestoneId, milestoneName: milestone.name }
      });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
