import express from 'express';
import { protect, authorizedRoles } from '../middlewares/authMiddleware.js';
import Category from '../models/Category.js';

const router = express.Router();

// Public: Get all active categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all categories (including inactive)
router.get('/admin', protect, authorizedRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Create category
router.post('/', protect, authorizedRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, slug, icon, templateType, description } = req.body;
    
    // Check if slug already exists
    const existing = await Category.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this slug already exists' });
    }

    const category = await Category.create({
      name,
      slug: slug.toLowerCase(),
      icon,
      templateType,
      description
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update category
router.put('/:id', protect, authorizedRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Delete category
router.delete('/:id', protect, authorizedRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
