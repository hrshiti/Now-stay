// routes/whatsappBookingRoutes.js
import express from 'express';
import { bookHotelAndSendWA } from '../controllers/whatsappBookingController.js';

const router = express.Router();

// POST /api/book-hotel strictly mapped here
router.post('/', bookHotelAndSendWA);

export default router;
