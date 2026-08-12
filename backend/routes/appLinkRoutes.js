import express from 'express';
import {
  getAppLinks,
  createAppLink,
  updateAppLink,
  deleteAppLink,
  toggleAppLinkStatus
} from '../controllers/appLinkController.js';
import { protect, authorizedRoles } from '../middlewares/authMiddleware.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Public route to fetch active app links
router.get('/', getAppLinks);

// Admin protected routes
router.get('/admin/all', protect, authorizedRoles('admin', 'superadmin'), getAppLinks);
router.post('/admin/create', protect, authorizedRoles('admin', 'superadmin'), upload.single('logoFile'), createAppLink);
router.put('/admin/update/:id', protect, authorizedRoles('admin', 'superadmin'), upload.single('logoFile'), updateAppLink);
router.delete('/admin/delete/:id', protect, authorizedRoles('admin', 'superadmin'), deleteAppLink);
router.patch('/admin/toggle/:id', protect, authorizedRoles('admin', 'superadmin'), toggleAppLinkStatus);

export default router;
