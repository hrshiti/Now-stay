import express from 'express';
import { protect, authorizedRoles, isApprovedPartner } from '../middlewares/authMiddleware.js';
import {
  getPartnerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotifications,
  updateFcmToken,
  deletePartnerAccount
} from '../controllers/partnerController.js';

const router = express.Router();

router.use(protect);
router.use(authorizedRoles('partner', 'admin'));
router.delete('/profile', deletePartnerAccount);

// Notification Routes
router.get('/notifications', getPartnerNotifications);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);
router.delete('/notifications', markNotificationRead); // Should ideally be protected if it's destructive
router.put('/fcm-token', updateFcmToken);

export default router;
