const express = require('express');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Document = require('../models/Document');
const Template = require('../models/Template');
const { auth } = require('../middleware/auth');

const router = express.Router();

const WORKFLOW_STAGES = {
  Lead: {
    next: 'Proposal',
    documents: [],
    description: 'Initial lead capture'
  },
  Proposal: {
    next: 'Agreement',
    documents: ['Proposal Template'],
    description: 'Sending project proposal'
  },
  Agreement: {
    next: 'Onboarding',
    documents: ['Client Agreement', 'Welcome Document'],
    description: 'Legal agreement and welcome packet'
  },
  Onboarding: {
    next: 'Development',
    documents: ['Client Portal Guide', 'Project Timeline'],
    description: 'Setting up client access and planning'
  },
  Development: {
    next: 'Delivery',
    documents: [],
    description: 'Building the project'
  },
  Delivery: {
    next: 'Handoff',
    documents: ['Fulfilment Checklist', 'Content Usage Guide'],
    description: 'Delivering and testing'
  },
  Handoff: {
    next: 'Completed',
    documents: ['Thank You Document', 'Thank You Package'],
    description: 'Final handoff and documentation'
  },
  Completed: {
    next: null,
    documents: [],
    description: 'Project complete'
  }
};

router.get('/stages', auth, async (req, res) => {
  try {
    res.json(WORKFLOW_STAGES);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stages/:stage', auth, async (req, res) => {
  try {
    const stage = WORKFLOW_STAGES[req.params.stage];
    if (!stage) {
      return res.status(404).json({ message: 'Stage not found' });
    }
    res.json(stage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/advance', auth, async (req, res) => {
  try {
    const { entityType, entityId } = req.body;
    
    let entity;
    if (entityType === 'project') {
      entity = await Project.findById(entityId).populate('client');
    } else if (entityType === 'lead') {
      entity = await Lead.findById(entityId);
    }

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    const currentStage = entity.status;
    const stageConfig = WORKFLOW_STAGES[currentStage];
    
    if (!stageConfig || !stageConfig.next) {
      return res.status(400).json({ message: 'Cannot advance from this stage' });
    }

    const nextStage = stageConfig.next;
    entity.status = nextStage;
    await entity.save();

    const generatedDocuments = [];
    if (stageConfig.documents.length > 0) {
      for (const docType of stageConfig.documents) {
        const template = await Template.findOne({ type: docType, isActive: true });
        
        if (template) {
          let variables = { ...template.defaultVariables };
          
          if (entityType === 'project' && entity.client) {
            variables = {
              ...variables,
              client_name: entity.client.name,
              company_name: entity.client.company,
              project_name: entity.name,
              date: new Date().toLocaleDateString()
            };
          } else if (entityType === 'lead') {
            variables = {
              ...variables,
              client_name: entity.name,
              company_name: entity.company,
              date: new Date().toLocaleDateString()
            };
          }

          const toKebap = (str) => str.toLowerCase().replace(/ /g, '-');
          
          const document = new Document({
            title: `${template.name} - ${entity.name || 'Project'}`,
            templateType: toKebap(template.type),
            content: template.content,
            htmlContent: template.htmlContent,
            variables,
            fields: variables, // Sync fields with variables for the editor
            template: template._id,
            [entityType]: entityId,
            owner: req.user._id,
            createdBy: req.user._id
          });
          await document.save();
          
          template.usageCount += 1;
          await template.save();

          generatedDocuments.push(document);
        }
      }
    }

    if (nextStage === 'Onboarding' && entityType === 'project' && entity.client) {
      const { sendOnboardingEmail } = require('../utils/email');
      sendOnboardingEmail(entity.client).catch(err => console.error('Onboarding email failed:', err));
    }

    res.json({
      message: `Advanced to ${nextStage}`,
      previousStage: currentStage,
      newStage: nextStage,
      generatedDocuments,
      stageConfig: WORKFLOW_STAGES[nextStage]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/generate-document', auth, async (req, res) => {
  try {
    const { entityType, entityId, templateId } = req.body;
    
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    let entity;
    if (entityType === 'project') {
      entity = await Project.findById(entityId).populate('client');
    } else if (entityType === 'client') {
      entity = await Client.findById(entityId);
    } else if (entityType === 'lead') {
      entity = await Lead.findById(entityId);
    }

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    let variables = { ...template.defaultVariables };
    
    if (entityType === 'project' && entity.client) {
      variables = {
        ...variables,
        client_name: entity.client.name,
        company_name: entity.client.company,
        project_name: entity.name,
        date: new Date().toLocaleDateString()
      };
    } else if (entityType === 'client') {
      variables = {
        ...variables,
        client_name: entity.name,
        company_name: entity.company,
        date: new Date().toLocaleDateString()
      };
    } else if (entityType === 'lead') {
      variables = {
        ...variables,
        client_name: entity.name,
        company_name: entity.company,
        date: new Date().toLocaleDateString()
      };
    }

    const toKebap = (str) => str.toLowerCase().replace(/ /g, '-');

    const document = new Document({
      title: `${template.name} - ${entity.name || 'Document'}`,
      templateType: toKebap(template.type),
      content: template.content,
      htmlContent: template.htmlContent,
      variables,
      fields: variables, // Sync fields for editor
      template: template._id,
      [entityType]: entityId,
      owner: req.user._id,
      createdBy: req.user._id
    });
    await document.save();

    template.usageCount += 1;
    await template.save();

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/suggested-documents/:stage', auth, async (req, res) => {
  try {
    const stageConfig = WORKFLOW_STAGES[req.params.stage];
    if (!stageConfig) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    const documents = await Template.find({
      type: { $in: stageConfig.documents },
      isActive: true
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
