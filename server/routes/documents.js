const express = require('express');
const crypto = require('crypto');
const Document = require('../models/Document');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');
const { generatePDF, generateDOCX } = require('../utils/export');
const templateRenderer = require('../utils/templateRenderer');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    
    const query = { owner: req.user._id };
    
    if (type) query.templateType = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      documents,
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

router.get('/templates', auth, async (req, res) => {
  const templates = [
    { key: 'client-agreement', label: 'Client Agreement', color: '#9b7cff', description: 'Service agreement with payment terms' },
    { key: 'welcome-document', label: 'Welcome Document', color: '#39e97b', description: 'Welcome letter for new clients' },
    { key: 'invoice', label: 'Invoice', color: '#3acdff', description: 'Professional invoice template' },
    { key: 'client-portal-guide', label: 'Client Portal Guide', color: '#ff7c3a', description: 'Notion dashboard instructions' },
    { key: 'project-timeline', label: 'Project Timeline', color: '#39e97b', description: 'Visual project roadmap' },
    { key: 'fulfilment-checklist', label: 'Fulfilment Checklist', color: '#ffcc00', description: 'Delivery checklist' },
    { key: 'content-usage-guide', label: 'Content Usage Guide', color: '#3acdff', description: 'How to use deliverables' },
    { key: 'monthly-report', label: 'Monthly Report', color: '#9b7cff', description: 'Monthly progress report' },
    { key: 'competition-analysis', label: 'Competition Analysis', color: '#ff7c3a', description: 'Competitor research' },
    { key: 'thank-you-document', label: 'Thank You Document', color: '#39e97b', description: 'Thank you note after completion' },
    { key: 'thank-you-package', label: 'Thank You Package', color: '#ffcc00', description: 'Final handoff with credentials' }
  ];
  res.json(templates);
});

router.get('/templates/:type', auth, async (req, res) => {
  try {
    const config = templateRenderer.getTemplateConfig(req.params.type);
    if (!config) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check ownership or share access
    const ownerId = document.owner._id || document.owner;
    if (ownerId && ownerId.toString() !== req.user._id.toString() && !document.isShareEnabled) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { templateType, title, fields } = req.body;
    
    const document = new Document({
      templateType: templateType || 'custom',
      title: title || 'Untitled Document',
      fields: fields || {},
      owner: req.user._id
    });
    await document.save();

    await Activity.create({
      type: 'document_created',
      description: `Document created: ${document.title}`,
      user: req.user._id,
      entityType: 'document',
      entityId: document._id
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, fields } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const ownerId = document.owner._id || document.owner;
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title !== undefined) document.title = title;
    if (fields !== undefined) document.fields = fields;
    document.updatedAt = new Date();
    
    await document.save();

    await Activity.create({
      type: 'document_updated',
      description: `Document updated: ${document.title}`,
      user: req.user._id,
      entityType: 'document',
      entityId: document._id
    });

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/share', auth, async (req, res) => {
  try {
    const { enable } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const ownerId = document.owner._id || document.owner;
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let shareToken;
    if (enable) {
      if (!document.shareToken) {
        document.shareToken = crypto.randomUUID();
      }
      document.isShareEnabled = true;
      shareToken = document.shareToken;
    } else {
      document.isShareEnabled = false;
    }
    
    await document.save();

    res.json({
      isShareEnabled: document.isShareEnabled,
      shareToken: document.shareToken,
      shareUrl: document.isShareEnabled ? `/shared/${document.shareToken}` : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/shared/:shareToken', async (req, res) => {
  try {
    const document = await Document.findOne({ 
      shareToken: req.params.shareToken,
      isShareEnabled: true
    }).populate('owner', 'name');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found or not shared' });
    }

    const templateConfig = templateRenderer.getTemplateConfig(document.templateType);
    
    const fieldsObj = document.fields instanceof Map 
      ? Object.fromEntries(document.fields) 
      : (document.fields || {});

    res.json({
      document: {
        _id: document._id,
        title: document.title,
        templateType: document.templateType,
        fields: fieldsObj,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        htmlContent: document.htmlContent
      },
      templateConfig,
      owner: document.owner
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/export/pdf', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const ownerId = document.owner._id || document.owner;
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Convert fields safely
    const fieldsObj = document.fields instanceof Map 
      ? Object.fromEntries(document.fields) 
      : (document.fields || {});

    let htmlContent;
    
    // Preference: use saved htmlContent if it's likely a custom document or edited
    if (document.htmlContent && (document.templateType === 'custom' || document.templateType === 'proposal-template')) {
      htmlContent = document.htmlContent;
    } else {
      htmlContent = templateRenderer.renderTemplate(
        document.templateType,
        fieldsObj,
        { raw: true }
      );
    }
    
    const pdfBuffer = await generatePDF(htmlContent, {
      name: document.title,
      type: document.templateType,
      color: templateRenderer.getTemplateConfig(document.templateType).color
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Export Route Error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/export/docx', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const ownerId = document.owner._id || document.owner;
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Convert fields safely
    const fieldsObj = document.fields instanceof Map 
      ? Object.fromEntries(document.fields) 
      : (document.fields || {});

    const docxBuffer = await generateDOCX(
      document.templateType,
      fieldsObj,
      { name: document.title, type: document.templateType }
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.docx"`);
    res.send(docxBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const ownerId = document.owner._id || document.owner;
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await document.deleteOne();

    await Activity.create({
      type: 'document_deleted',
      description: `Document deleted: ${document.title}`,
      user: req.user._id,
      entityType: 'document',
      entityId: document._id
    });

    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const ownerId = document.owner._id || document.owner;
    if (ownerId && ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const newDocument = new Document({
      templateType: document.templateType,
      title: `${document.title} (Copy)`,
      fields: document.fields,
      owner: req.user._id
    });
    await newDocument.save();

    res.status(201).json(newDocument);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
