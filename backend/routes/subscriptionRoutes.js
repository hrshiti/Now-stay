import express from 'express';
import { 
  createPlan, 
  getPlans, 
  updatePlan, 
  deletePlan, 
  getPartnerSubscriptions,
  getActivePlans,
  getMySubscription,
  buySubscription,
  createSubscriptionOrder
} from '../controllers/subscriptionController.js';
import { protect, authorizedRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- ADMIN ROUTES ---
router.post('/admin/plans', protect, authorizedRoles('admin', 'superadmin'), createPlan);
router.get('/admin/plans', protect, authorizedRoles('admin', 'superadmin'), getPlans);
router.put('/admin/plans/:id', protect, authorizedRoles('admin', 'superadmin'), updatePlan);
router.delete('/admin/plans/:id', protect, authorizedRoles('admin', 'superadmin'), deletePlan);
router.get('/admin/partner-subscriptions', protect, authorizedRoles('admin', 'superadmin'), getPartnerSubscriptions);

// --- PARTNER ROUTES ---
router.get('/plans', protect, authorizedRoles('partner'), getActivePlans);
router.get('/my-subscription', protect, authorizedRoles('partner'), getMySubscription);
router.post('/create-order', protect, authorizedRoles('partner'), createSubscriptionOrder);
router.post('/buy-subscription', protect, authorizedRoles('partner'), buySubscription);

export default router;
