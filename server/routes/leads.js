const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { auth, clientAccess } = require('../middleware/auth');
const { parseFile, mapHeaders, transformData, getSuggestedMapping, getAvailableFields, APP_HEADERS } = require('../utils/importUtils');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and XLSX files are allowed'));
    }
  }
});

// Public Lead Submission (No Auth)
router.post('/public', async (req, res) => {
  try {
    const { name, email, phone, company, biztype, notes, website, source } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and Phone are required' });
    }

    const lead = new Lead({
      name,
      email,
      phone,
      company,
      biztype,
      notes,
      website,
      source: source || 'Public Portfolio',
      status: 'New'
    });

    await lead.save();

    // Log Activity (without associated user)
    await Activity.create({
      type: 'lead_created',
      description: `New lead from ${lead.source}: ${lead.name}`,
      entityType: 'lead',
      entityId: lead._id,
      metadata: { source: 'public_form' }
    });

    res.status(201).json({ success: true, message: 'Thank you! Your inquiry has been received.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { status, channel, biztype, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (channel) query.channel = channel;
    if (biztype) query.biztype = biztype;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('clientId', 'name company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      leads,
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
    const leads = await Lead.find();
    
    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => ['Contacted', 'Replied', 'Call Booked', 'Proposal Sent', 'Follow Up'].includes(l.status)).length,
      replied: leads.filter(l => ['Replied', 'Call Booked'].includes(l.status)).length,
      callsBooked: leads.filter(l => l.status === 'Call Booked').length,
      proposalSent: leads.filter(l => l.status === 'Proposal Sent').length,
      closed: leads.filter(l => l.status === 'Closed').length,
      rejected: leads.filter(l => l.status === 'Rejected').length,
      revenue: leads.filter(l => l.status === 'Closed').reduce((sum, l) => sum + (l.value || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('clientId');
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const lead = new Lead({
      ...req.body,
      assignedTo: req.user._id
    });
    await lead.save();

    await Activity.create({
      type: 'lead_created',
      description: `New lead created: ${lead.name}`,
      user: req.user._id,
      entityType: 'lead',
      entityId: lead._id
    });

    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (req.body.status && req.body.status !== oldLead.status) {
      await Activity.create({
        type: 'lead_status_changed',
        description: `Lead ${lead.name} status changed from ${oldLead.status} to ${req.body.status}`,
        user: req.user._id,
        entityType: 'lead',
        entityId: lead._id,
        metadata: { oldStatus: oldLead.status, newStatus: req.body.status }
      });
    } else {
      await Activity.create({
        type: 'lead_updated',
        description: `Lead ${lead.name} updated`,
        user: req.user._id,
        entityType: 'lead',
        entityId: lead._id
      });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await Activity.create({
      type: 'lead_deleted',
      description: `Lead ${lead.name} deleted`,
      user: req.user._id,
      entityType: 'lead',
      entityId: lead._id
    });

    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/import', auth, async (req, res) => {
  try {
    const { leads } = req.body;
    
    const importedLeads = await Lead.insertMany(
      leads.map(l => ({
        ...l,
        assignedTo: req.user._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );

    res.status(201).json({ count: importedLeads.length, leads: importedLeads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/import/analyze', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      // Clean up invalid file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: `Invalid file type: ${ext}. Please upload CSV or Excel files only.` 
      });
    }

    const filePath = req.file.path;
    
    try {
      const { headers, data } = parseFile(filePath);
      
      if (!headers || headers.length === 0) {
        return res.status(400).json({ 
          message: 'Could not parse file. Please check if the file has headers in the first row.' 
        });
      }
      
      const suggestedMapping = getSuggestedMapping(headers);
      const availableFields = getAvailableFields();

      res.json({
        fileHeaders: headers,
        suggestedMapping,
        availableFields,
        preview: data.slice(0, 5),
        totalRows: data.length
      });
    } catch (parseError) {
      return res.status(400).json({ 
        message: `Error parsing file: ${parseError.message}` 
      });
    } finally {
      // Clean up uploaded file after processing
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/import/confirm', auth, async (req, res) => {
  try {
    const { mapping, data } = req.body;
    const { transformed, errors } = transformData(data, mapping);

    if (transformed.length === 0) {
      return res.status(400).json({ 
        message: 'No valid leads to import',
        errors 
      });
    }

    const leads = await Lead.insertMany(
      transformed.map(lead => ({
        ...lead,
        assignedTo: req.user._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );

    await Activity.create({
      type: 'lead_created',
      description: `Imported ${leads.length} leads from CSV/XLSX`,
      user: req.user._id,
      metadata: { count: leads.length }
    });

    res.json({
      success: true,
      imported: leads.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/import/fields', auth, async (req, res) => {
  res.json(getAvailableFields());
});

router.get('/export/csv', auth, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    
    const csv = [
      'Name,Company,Phone,Email,Website,Business Type,Channel,Status,Value,Notes,Follow Up,Created',
      ...leads.map(l => [
        `"${l.name || ''}"`,
        `"${l.company || ''}"`,
        `"${l.phone || ''}"`,
        `"${l.email || ''}"`,
        `"${l.website || ''}"`,
        `"${l.biztype || ''}"`,
        `"${l.channel || ''}"`,
        `"${l.status || ''}"`,
        l.value || '',
        `"${(l.notes || '').replace(/"/g, '""')}"`,
        l.followupDate || '',
        l.createdAt
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
