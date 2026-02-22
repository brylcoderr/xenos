const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { auth, adminOnly, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, role: role || 'team' });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    await Activity.create({
      type: 'user_login',
      description: `User ${user.name} logged in`,
      user: user._id,
      metadata: { email: user.email }
    });

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

router.put('/me', auth, async (req, res) => {
  try {
    const updates = ['name', 'phone', 'avatar'];
    updates.forEach(field => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });
    req.user.updatedAt = new Date();
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    req.user.password = newPassword;
    await req.user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password, role });
    await user.save();
    
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    let adminUser;
    
    if (userCount === 0) {
      // Create first admin user
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@xenotrix.com',
        password: 'password',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
    } else {
      adminUser = await User.findOne({ role: 'admin' });
    }

    if (!adminUser && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Seeding disabled' });
    }
    
    // Asset Integration (Premium HTML Templates & Internal Resources)
    const fs = require('fs');
    const path = require('path');
    const assetsPath = path.join(__dirname, '../../Assets');
    const Template = require('../models/Template');

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
      },
      {
        fileName: 'wa_outreach_guide.html',
        type: 'Internal Resource',
        name: 'WhatsApp Outreach Guide',
        variables: []
      },
      {
        fileName: 'xenotrix_coldcall_script.html',
        type: 'Internal Resource',
        name: 'Expert Cold Call Script',
        variables: ['your_name']
      },
      {
        fileName: 'xenotrix_crm_dashboard.html',
        type: 'Internal Resource',
        name: 'CRM Workflow Dashboard',
        variables: []
      },
      {
        fileName: 'xenotrix_onboarding_checklist.html',
        type: 'Internal Resource',
        name: 'Client Success Checklist',
        variables: []
      },
      {
        fileName: 'xenotrix_service_contract.html',
        type: 'Internal Resource',
        name: 'Master Service Agreement',
        variables: []
      }
    ];

    for (const t of premiumAssets) {
      const filePath = path.join(assetsPath, t.fileName);
      if (fs.existsSync(filePath)) {
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        // Update if exists, or create
        await Template.findOneAndUpdate(
          { name: t.name },
          {
            name: t.name,
            type: t.type,
            htmlContent: htmlContent,
            variables: t.variables,
            isActive: true,
            createdBy: adminUser._id
          },
          { upsert: true, new: true }
        );
      }
    }
    
    res.json({ 
      message: 'Seed successful - Premium assets synchronized', 
      user: { email: adminUser.email, password: 'password' },
      assetsProcessed: premiumAssets.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
