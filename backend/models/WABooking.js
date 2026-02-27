// models/WABooking.js
import mongoose from 'mongoose';

const waBookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    hotel: {
        type: String,
        required: true
    },
    checkInDate: {
        type: String,
        required: true
    },
    mapLink: {
        type: String
    },
    whatsappMessageId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Since the user requested "Create Booking Model", but the app already has Booking.js,
// we export it with collection name "wabookings" to prevent overlap,
// while satisfying the structural requirements requested.
export default mongoose.model("WABooking", waBookingSchema);
