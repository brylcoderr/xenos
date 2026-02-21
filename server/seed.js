require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Lead = require('./models/Lead');
const Client = require('./models/Client');
const Project = require('./models/Project');
const Template = require('./models/Template');
const Invoice = require('./models/Invoice');
const Document = require('./models/Document');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xenotrix-agency';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Client.deleteMany({}),
    Project.deleteMany({}),
    Template.deleteMany({}),
    Invoice.deleteMany({}),
    Document.deleteMany({}),
  ]);
  console.log('✓ Cleared existing data');

  // Create users
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@xenotrix.com',
    password: 'password',
    role: 'admin',
    isActive: true,
  });

  const teamUser = await User.create({
    name: 'Team Member',
    email: 'team@xenotrix.com',
    password: 'password',
    role: 'team',
    isActive: true,
  });
  console.log('✓ Created users');

  // Create leads
  const leads = await Lead.insertMany([
    { name: 'Rajesh Kumar', company: 'Spice Garden Restaurant', phone: '+91 98765 43210', email: 'rajesh@spicegarden.com', biztype: 'Restaurant', channel: 'WhatsApp', status: 'Contacted', value: 1500, notes: 'Website redesign needed', followupDate: new Date(Date.now() + 86400000), assignedTo: teamUser._id },
    { name: 'Dr. Priya Sharma', company: 'Sharma Clinic', phone: '+91 87654 32109', email: 'priya@sharmaclinic.com', biztype: 'Clinic', channel: 'Cold Call', status: 'Call Booked', value: 2500, notes: 'Appointment booking system + website', assignedTo: adminUser._id },
    { name: 'Amit Verma', company: 'Verma Law Associates', phone: '+91 76543 21098', email: 'amit@vermalaw.com', biztype: 'Lawyer', channel: 'WhatsApp', status: 'Replied', value: 2000, notes: 'Needs portfolio website', assignedTo: teamUser._id },
    { name: 'Sunita Patel', company: 'FitLife Gym', phone: '+91 65432 10987', email: 'sunita@fitlife.com', biztype: 'Gym', channel: 'WhatsApp', status: 'New', value: 0 },
    { name: 'Vikram Singh', company: 'Singh Properties', phone: '+91 54321 09876', email: 'vikram@singhproperties.com', biztype: 'Real Estate', channel: 'SMS', status: 'Proposal Sent', value: 3500, notes: 'Property listing site with search', assignedTo: adminUser._id },
    { name: 'Neha Gupta', company: 'Gupta Sweets', phone: '+91 43210 98765', email: 'neha@guptasweets.com', biztype: 'Retail', channel: 'WhatsApp', status: 'Closed', value: 1200, notes: 'Landing page delivered', assignedTo: teamUser._id },
    { name: 'Mohammad Ali', company: 'Ali Dental Clinic', phone: '+91 32109 87654', email: 'ali@alidental.com', biztype: 'Clinic', channel: 'LinkedIn', status: 'Follow Up', value: 1800, notes: 'Waiting for proposal approval', assignedTo: adminUser._id },
    { name: 'Sarah Johnson', company: 'Sarah Makeup Studio', phone: '+91 21098 76543', email: 'sarah@makeupstudio.com', biztype: 'Retail', channel: 'Instagram', status: 'New', value: 0 },
  ]);
  console.log('✓ Created leads');

  // Create clients
  const clients = await Client.insertMany([
    { name: 'Rajesh Kumar', company: 'Spice Garden Restaurant', email: 'rajesh@spicegarden.com', phone: '+91 98765 43210', industry: 'Restaurant', status: 'Onboarding', dealValue: 1500, owner: teamUser._id },
    { name: 'Dr. Priya Sharma', company: 'Sharma Clinic', email: 'priya@sharmaclinic.com', phone: '+91 87654 32109', industry: 'Healthcare', status: 'Active', dealValue: 2500, owner: adminUser._id },
    { name: 'Neha Gupta', company: 'Gupta Sweets', email: 'neha@guptasweets.com', phone: '+91 43210 98765', industry: 'Retail', status: 'Completed', dealValue: 1200, owner: teamUser._id },
  ]);
  console.log('✓ Created clients');

  // Create projects
  const projects = await Project.insertMany([
    { name: 'Website Redesign', description: 'Complete redesign of restaurant website with online ordering', client: clients[0]._id, status: 'Onboarding', budget: 1500, owner: teamUser._id, progress: 20 },
    { name: 'Clinic Booking System', description: 'Appointment booking system with patient portal', client: clients[1]._id, status: 'Development', budget: 2500, owner: adminUser._id, progress: 45 },
    { name: 'Landing Page', description: 'Single page website for sweet shop', client: clients[2]._id, status: 'Completed', budget: 1200, owner: teamUser._id, progress: 100 },
  ]);
  console.log('✓ Created projects');

  // Update clients with projects
  await Client.findByIdAndUpdate(clients[0]._id, { projects: [projects[0]._id] });
  await Client.findByIdAndUpdate(clients[1]._id, { projects: [projects[1]._id] });
  await Client.findByIdAndUpdate(clients[2]._id, { projects: [projects[2]._id] });

  // Asset Integration (Premium HTML Templates)
  const fs = require('fs');
  const path = require('path');
  const assetsPath = path.join(__dirname, '../Assets');

  const premiumAssets = [
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

  for (const t of premiumAssets) {
    const filePath = path.join(assetsPath, t.fileName);
    if (fs.existsSync(filePath)) {
      const htmlContent = fs.readFileSync(filePath, 'utf8');
      await Template.create({
        name: t.name,
        type: t.type,
        htmlContent: htmlContent,
        variables: t.variables,
        isActive: true,
        createdBy: adminUser._id
      });
      console.log(`✓ Seeded premium asset: ${t.fileName}`);
    }
  }

  // Create standard templates for types without premium assets
  const templateTypes = [
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

  for (const type of templateTypes) {
    const exists = await Template.findOne({ type });
    if (!exists) {
      await Template.create({
        name: `Standard ${type}`,
        type,
        content: `Placeholder for ${type}`,
        variables: ['client_name', 'project_name', 'date'],
        isActive: true,
        createdBy: adminUser._id
      });
    }
  }
  console.log('✓ Created remaining templates');

  // Create invoices
  const invoices = await Invoice.insertMany([
    { invoiceNumber: 'INV-0001', client: clients[0]._id, project: projects[0]._id, type: 'Deposit', items: [{ description: 'Project Deposit (50%)', quantity: 1, rate: 750, amount: 750 }], subtotal: 750, taxRate: 0, total: 750, status: 'Paid', dueDate: new Date(Date.now() + 7 * 86400000), paidDate: new Date(), createdBy: teamUser._id },
    { invoiceNumber: 'INV-0002', client: clients[1]._id, project: projects[1]._id, type: 'Milestone', items: [{ description: 'Phase 1 - Discovery & Planning', quantity: 1, rate: 625, amount: 625 }], subtotal: 625, taxRate: 0, total: 625, status: 'Sent', dueDate: new Date(Date.now() + 14 * 86400000), createdBy: adminUser._id },
    { invoiceNumber: 'INV-0003', client: clients[2]._id, project: projects[2]._id, type: 'Final', items: [{ description: 'Final Payment', quantity: 1, rate: 600, amount: 600 }], subtotal: 600, taxRate: 0, total: 600, status: 'Paid', dueDate: new Date(Date.now() - 7 * 86400000), paidDate: new Date(Date.now() - 3 * 86400000), createdBy: teamUser._id },
  ]);
  console.log('✓ Created invoices');

  // Update clients with invoices
  await Client.findByIdAndUpdate(clients[0]._id, { invoices: [invoices[0]._id] });
  await Client.findByIdAndUpdate(clients[1]._id, { invoices: [invoices[1]._id] });
  await Client.findByIdAndUpdate(clients[2]._id, { invoices: [invoices[2]._id] });

  console.log('\n✅ Seed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@xenotrix.com');
  console.log('  Password: password');
  console.log('\n  Email: team@xenotrix.com');
  console.log('  Password: password');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
