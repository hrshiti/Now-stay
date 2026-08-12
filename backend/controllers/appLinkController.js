import AppLink from '../models/AppLink.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @desc    Get all app links (Public gets active only, Admin gets all)
// @route   GET /api/app-links or /api/admin/app-links
// @access  Public / Admin
export const getAppLinks = async (req, res) => {
  try {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    const query = isAdmin ? {} : { isActive: true };

    const appLinks = await AppLink.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appLinks.length,
      appLinks
    });
  } catch (error) {
    console.error('Error fetching app links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app links',
      error: error.message
    });
  }
};

// @desc    Create a new app link
// @route   POST /api/admin/app-links
// @access  Private/Admin
export const createAppLink = async (req, res) => {
  try {
    const { name, logo, playStoreUrl, appStoreUrl, isActive, order } = req.body;

    let logoUrl = logo;

    // Handle file upload if sent as req.file
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, 'app_logos');
      logoUrl = uploadResult.url;
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'App Name is required' });
    }

    if (!logoUrl || !logoUrl.trim()) {
      return res.status(400).json({ success: false, message: 'App Logo is required' });
    }

    const appLink = await AppLink.create({
      name: name.trim(),
      logo: logoUrl.trim(),
      playStoreUrl: playStoreUrl ? playStoreUrl.trim() : '',
      appStoreUrl: appStoreUrl ? appStoreUrl.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: order ? Number(order) : 0
    });

    res.status(201).json({
      success: true,
      message: 'App link created successfully',
      appLink
    });
  } catch (error) {
    console.error('Error creating app link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create app link',
      error: error.message
    });
  }
};

// @desc    Update app link
// @route   PUT /api/admin/app-links/:id
// @access  Private/Admin
export const updateAppLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, playStoreUrl, appStoreUrl, isActive, order } = req.body;

    const appLink = await AppLink.findById(id);

    if (!appLink) {
      return res.status(404).json({ success: false, message: 'App link not found' });
    }

    let logoUrl = logo || appLink.logo;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, 'app_logos');
      logoUrl = uploadResult.url;
    }

    if (name) appLink.name = name.trim();
    if (logoUrl) appLink.logo = logoUrl.trim();
    if (playStoreUrl !== undefined) appLink.playStoreUrl = playStoreUrl.trim();
    if (appStoreUrl !== undefined) appLink.appStoreUrl = appStoreUrl.trim();
    if (isActive !== undefined) appLink.isActive = Boolean(isActive);
    if (order !== undefined) appLink.order = Number(order);

    await appLink.save();

    res.status(200).json({
      success: true,
      message: 'App link updated successfully',
      appLink
    });
  } catch (error) {
    console.error('Error updating app link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update app link',
      error: error.message
    });
  }
};

// @desc    Delete app link
// @route   DELETE /api/admin/app-links/:id
// @access  Private/Admin
export const deleteAppLink = async (req, res) => {
  try {
    const { id } = req.params;
    const appLink = await AppLink.findByIdAndDelete(id);

    if (!appLink) {
      return res.status(404).json({ success: false, message: 'App link not found' });
    }

    res.status(200).json({
      success: true,
      message: 'App link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting app link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete app link',
      error: error.message
    });
  }
};

// @desc    Toggle active status of app link
// @route   PATCH /api/admin/app-links/:id/toggle
// @access  Private/Admin
export const toggleAppLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const appLink = await AppLink.findById(id);

    if (!appLink) {
      return res.status(404).json({ success: false, message: 'App link not found' });
    }

    appLink.isActive = !appLink.isActive;
    await appLink.save();

    res.status(200).json({
      success: true,
      message: `App link ${appLink.isActive ? 'activated' : 'deactivated'} successfully`,
      appLink
    });
  } catch (error) {
    console.error('Error toggling app link status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle status',
      error: error.message
    });
  }
};
