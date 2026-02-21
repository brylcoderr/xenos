const express = require('express');
const Template = require('../models/Template');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { type, isTemplate, search, page = 1, limit = 20 } = req.query;
    
    const query = { isActive: true };
    
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Template.countDocuments(query);
    const templates = await Template.find(query)
      .populate('createdBy', 'name')
      .sort({ usageCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      templates,
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

router.get('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const template = new Template({
      ...req.body,
      createdBy: req.user._id
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const original = await Template.findById(req.params.id);
    
    if (!original) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const duplicate = new Template({
      name: `${original.name} (Copy)`,
      type: original.type,
      content: original.content,
      htmlContent: original.htmlContent,
      variables: original.variables,
      defaultVariables: original.defaultVariables,
      header: original.header,
      footer: original.footer,
      logo: original.logo,
      primaryColor: original.primaryColor,
      accentColor: original.accentColor,
      category: original.category,
      description: original.description,
      createdBy: req.user._id
    });
    await duplicate.save();

    res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/types/list', auth, async (req, res) => {
  try {
    const types = [
      'Client Agreement',
      'Welcome Document',
      'Invoice',
      'Client Portal Guide',
      'Project Timeline',
      'Fulfilment Checklist',
      'Content Usage Guide',
      'Monthly Report',
      'Competition Analysis',
      'Thank You Document',
      'Thank You Package',
      'Proposal Template',
      'Custom'
    ];
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/seed/defaults', auth, adminOnly, async (req, res) => {
  try {
    const defaultTemplates = [
      {
        name: 'Client Agreement',
        type: 'Client Agreement',
        content: `<h2>Service Agreement</h2>
<p>This Service Agreement ("Agreement") is entered into as of {{date}} by and between:</p>
<p><strong>XENOTRIX</strong> ("Agency") and <strong>{{client_name}}</strong> ("Client")</p>

<h3>1. Services</h3>
<p>The Agency agrees to provide the following services to the Client:</p>
<ul>
<li>Project: {{project_name}}</li>
<li>Scope: {{project_scope}}</li>
</ul>

<h3>2. Payment Terms</h3>
<p>Total Project Value: {{amount}}</p>
<p>Payment Schedule: {{payment_terms}}</p>

<h3>3. Timeline</h3>
<p>Project Start Date: {{start_date}}</p>
<p>Estimated Completion: {{end_date}}</p>

<h3>4. Terms & Conditions</h3>
<p>{{terms_conditions}}</p>

<div class="signature-block">
  <div class="sig-box">
    <div class="sig-line"></div>
    <div class="sig-label">Agency Signature</div>
  </div>
  <div class="sig-box">
    <div class="sig-line"></div>
    <div class="sig-label">Client Signature</div>
  </div>
</div>`,
        variables: ['client_name', 'company_name', 'date', 'project_name', 'project_scope', 'amount', 'payment_terms', 'start_date', 'end_date', 'terms_conditions'],
        description: 'Standard client agreement template',
        isDefault: true,
        primaryColor: '#9b7cff',
        accentColor: '#39e97b'
      },
      {
        name: 'Welcome Document',
        type: 'Welcome Document',
        content: `<h2>Welcome to Xenotrix!</h2>
<p>Dear {{client_name}},</p>
<p>Thank you for choosing Xenotrix for your {{project_name}} project. We're excited to work with you!</p>

<h3>What to Expect</h3>
<ul>
<li>Regular updates every Friday</li>
<li>Dedicated project manager</li>
<li>Transparent progress tracking</li>
</ul>

<h3>Your Project Team</h3>
<p>Your main point of contact: {{project_manager}}</p>

<h3>Next Steps</h3>
<ol>
<li>Sign the service agreement</li>
<li>Complete the onboarding questionnaire</li>
<li>Schedule your kickoff call</li>
</ol>

<p>We look forward to delivering exceptional results!</p>
<p>Best regards,<br>The Xenotrix Team</p>`,
        variables: ['client_name', 'company_name', 'project_name', 'project_manager', 'email'],
        description: 'Welcome document for new clients',
        isDefault: true,
        primaryColor: '#39e97b',
        accentColor: '#9b7cff'
      },
      {
        name: 'Invoice',
        type: 'Invoice',
        content: `<h2>INVOICE</h2>
<table>
<tr><td>Invoice Number:</td><td>{{invoice_number}}</td></tr>
<tr><td>Date:</td><td>{{date}}</td></tr>
<tr><td>Due Date:</td><td>{{due_date}}</td></tr>
</table>

<h3>Bill To:</h3>
<p>{{client_name}}<br>{{company_name}}<br>{{client_address}}</p>

<h3>Services</h3>
<table>
<tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
{{line_items}}
<tr><td colspan="3"><strong>Subtotal</strong></td><td>{{subtotal}}</td></tr>
<tr><td colspan="3">Tax ({{tax_rate}}%)</td><td>{{tax_amount}}</td></tr>
<tr><td colspan="3"><strong>Total</strong></td><td><strong>{{total}}</strong></td></tr>
</table>

<h3>Payment Details</h3>
<p>{{payment_details}}</p>

<p>Thank you for your business!</p>`,
        variables: ['invoice_number', 'date', 'due_date', 'client_name', 'company_name', 'client_address', 'line_items', 'subtotal', 'tax_rate', 'tax_amount', 'total', 'payment_details'],
        description: 'Professional invoice template',
        isDefault: true,
        primaryColor: '#3acdff',
        accentColor: '#39e97b'
      },
      {
        name: 'Proposal Template',
        type: 'Proposal Template',
        content: `<h2>Project Proposal</h2>
<p>Prepared for: {{client_name}}</p>
<p>Company: {{company_name}}</p>
<p>Date: {{date}}</p>

<h3>Executive Summary</h3>
<p>{{executive_summary}}</p>

<h3>Proposed Solution</h3>
<p>{{proposed_solution}}</p>

<h3>Timeline</h3>
<p>{{timeline}}</p>

<h3>Investment</h3>
<p>Total Investment: {{amount}}</p>

<h3>Next Steps</h3>
<ol>
<li>Review proposal</li>
<li>Schedule call to discuss</li>
<li>Sign agreement</li>
</ol>`,
        variables: ['client_name', 'company_name', 'date', 'executive_summary', 'proposed_solution', 'timeline', 'amount'],
        description: 'Professional proposal template',
        isDefault: true,
        primaryColor: '#ff7c3a',
        accentColor: '#9b7cff'
      },
      {
        name: 'Project Timeline',
        type: 'Project Timeline',
        content: `<h2>Project Timeline: {{project_name}}</h2>

<h3>Phase 1: Discovery & Planning</h3>
<ul>
<li>Requirements gathering</li>
<li>Brand analysis</li>
<li>Wireframes & mockups</li>
<li>Timeline: {{phase1_date}}</li>
</ul>

<h3>Phase 2: Development</h3>
<ul>
<li>Frontend development</li>
<li>Backend development</li>
<li>Content integration</li>
<li>Timeline: {{phase2_date}}</li>
</ul>

<h3>Phase 3: Testing & Launch</h3>
<ul>
<li>Quality assurance</li>
<li>Browser testing</li>
<li>Performance optimization</li>
<li>Launch</li>
<li>Timeline: {{phase3_date}}</li>
</ul>`,
        variables: ['project_name', 'client_name', 'phase1_date', 'phase2_date', 'phase3_date'],
        description: 'Visual project timeline',
        isDefault: true,
        primaryColor: '#f472b6',
        accentColor: '#3acdff'
      },
      {
        name: 'Thank You Package',
        type: 'Thank You Package',
        content: `<h2>Thank You for Your Business!</h2>
<p>Dear {{client_name}},</p>
<p>It has been our pleasure working with you on {{project_name}}. Here is your complete handoff package.</p>

<h3>Project Deliverables</h3>
{{deliverables}}

<h3>Access Credentials</h3>
{{credentials}}

<h3>Brand Assets</h3>
<ul>
<li>Logo files (AI, PNG, SVG)</li>
<li>Color palette</li>
<li>Typography</li>
<li>Brand guidelines</li>
</ul>

<h3>Next Steps</h3>
<ul>
<li>Review all deliverables</li>
<li>Update passwords</li>
<li>Schedule 30-day check-in</li>
</ul>

<p>We hope you love the result! Don't hesitate to reach out for any support.</p>
<p>With gratitude,<br>The Xenotrix Team</p>`,
        variables: ['client_name', 'company_name', 'project_name', 'deliverables', 'credentials'],
        description: 'Final handoff package',
        isDefault: true,
        primaryColor: '#ffcc00',
        accentColor: '#39e97b'
      }
    ];

    for (const templateData of defaultTemplates) {
      const exists = await Template.findOne({ name: templateData.name });
      if (!exists) {
        await Template.create({ ...templateData, createdBy: req.user._id });
      }
    }

    res.json({ message: 'Default templates seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
