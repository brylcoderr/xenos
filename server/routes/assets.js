const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const Project = require('../models/Project');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/assets');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/upload', auth, upload.array('files'), async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId);
    
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const newAssets = req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/assets/${file.filename}`,
      size: file.size,
      type: file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    }));

    // In a real app, you'd add an 'assets' field to the Project model
    // For now we'll just return the URLs
    res.json({ success: true, assets: newAssets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
