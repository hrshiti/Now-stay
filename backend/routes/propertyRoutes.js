import express from 'express';
import { protect, authorizedRoles, isApprovedPartner } from '../middlewares/authMiddleware.js';
import {
  createProperty,
  updateProperty,
  addRoomType,
  updateRoomType,
  deleteRoomType,
  upsertDocuments,
  getPublicProperties,
  getPropertyDetails,
  getMyProperties,
  deleteProperty
} from '../controllers/propertyController.js';

const router = express.Router();

router.get('/', getPublicProperties);
router.get('/my', protect, authorizedRoles('partner', 'admin'), getMyProperties);
router.get('/:id', getPropertyDetails);
router.post('/', protect, authorizedRoles('partner', 'admin'), isApprovedPartner, createProperty);
router.put('/:id', protect, authorizedRoles('partner', 'admin'), isApprovedPartner, updateProperty);
router.delete('/:id', protect, authorizedRoles('partner', 'admin'), isApprovedPartner, deleteProperty);
router.post('/:propertyId/room-types', protect, authorizedRoles('partner', 'admin'), isApprovedPartner, addRoomType);
router.put('/:propertyId/room-types/:roomTypeId', protect, authorizedRoles('partner', 'admin'), isApprovedPartner, updateRoomType);
router.delete('/:propertyId/room-types/:roomTypeId', protect, authorizedRoles('partner', 'admin'), isApprovedPartner, deleteRoomType);
router.post('/:propertyId/documents', protect, authorizedRoles('partner', 'admin'), isApprovedPartner, upsertDocuments);

export default router;
