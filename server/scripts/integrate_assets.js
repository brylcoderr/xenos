const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Template = require('../models/Template');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xenotrix-agency';

async function integrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const assetsPath = path.join(__dirname, '../../Assets');

    const templatesToUpdate = [
      {
        fileName: 'contract.html',
        type: 'Client Agreement',
        name: 'Premium Service Agreement',
        variables: ['client_name', 'company_name', 'project_name', 'amount', 'date', 'phone', 'email']
      },
      {
        fileName: 'onboarding.html',
        type: 'Welcome Document',
        name: 'Client Onboarding Dashboard',
        variables: ['client_name', 'company_name', 'project_name', 'delivery_date', 'amount']
      },
      {
        fileName: 'coldcall.html',
        type: 'Internal Resource',
        name: 'Cold Call Playbook',
        variables: ['your_name']
      },
      {
        fileName: 'xenotrix_roadmap.html',
        type: 'Internal Resource',
        name: 'Agency Growth Roadmap',
        variables: []
      },
      {
        fileName: 'n8n_automation_guide.html',
        type: 'Internal Resource',
        name: 'n8n Automation Guide',
        variables: []
      }
    ];

    for (const t of templatesToUpdate) {
      const filePath = path.join(assetsPath, t.fileName);
      if (fs.existsSync(filePath)) {
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        
        const update = {
          name: t.name,
          type: t.type,
          htmlContent: htmlContent,
          variables: t.variables,
          isActive: true,
          updatedAt: new Date()
        };

        const result = await Template.findOneAndUpdate(
          { type: t.type, name: t.name },
          update,
          { upsert: true, new: true }
        );
        console.log(`✓ Integrated ${t.fileName} as ${t.type}`);
      } else {
        console.warn(`✕ File not found: ${t.fileName}`);
      }
    }

    // Add other missing templates as placeholders if they don't exist
    const otherTypes = [
      'Invoice',
      'Client Portal Guide',
      'Project Timeline',
      'Fulfilment Checklist',
      'Content Usage Guide',
      'Monthly Report',
      'Competition Analysis',
      'Thank You Document',
      'Thank You Package',
      'Proposal Template'
    ];

    for (const type of otherTypes) {
      const exists = await Template.findOne({ type });
      if (!exists) {
        await Template.create({
          name: `Standard ${type}`,
          type,
          content: `Placeholder for ${type}`,
          variables: ['client_name', 'project_name', 'date'],
          isActive: true,
          isDefault: true
        });
        console.log(`✓ Created placeholder for ${type}`);
      }
    }

    console.log('\n✅ Asset integration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Integration error:', error);
    process.exit(1);
  }
}

integrate();
