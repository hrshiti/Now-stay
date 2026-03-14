import express from 'express';
import { seedNearbyProperties } from '../controllers/devController.js';

const router = express.Router();

router.post('/seed-nearby', seedNearbyProperties);

export default router;
