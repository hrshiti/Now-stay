// controllers/whatsappBookingController.js
import WABooking from '../models/WABooking.js';
import { sendWhatsAppMessage } from '../services/whatsapp.js';

export const bookHotelAndSendWA = async (req, res) => {
    try {
        const { name, phone, hotel, checkInDate, lat, lng } = req.body;

        // Validate required fields
        if (!name || !phone || !hotel || !checkInDate) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, hotel, and checkInDate are required fields.'
            });
        }

        // 1. Generate Google Map link using lat,lng
        let mapLink = '';
        if (lat && lng) {
            mapLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        }

        // 2. Format phone number: Remove "+" and Ensure it starts with 91
        let formattedPhone = phone.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '');

        // If phone length is 10, assume Indian and prepend 91
        if (formattedPhone.length === 10) {
            formattedPhone = `91${formattedPhone}`;
        } else if (!formattedPhone.startsWith('91') && formattedPhone.length > 10) {
            // It might be another country code, but standardizing to 91 per prompt requirement:
            // "ensure it starts with 91"
            // Alternatively, just prepend 91 if it's missing altogether.
            // Let's force it strictly as requested:
            formattedPhone = formattedPhone.startsWith('91') ? formattedPhone : `91${formattedPhone.slice(-10)}`;
        }

        // 3. Save booking to DB (without Message ID initially)
        const newBooking = await WABooking.create({
            name,
            phone: formattedPhone,
            hotel,
            checkInDate,
            mapLink,
            whatsappMessageId: null
        });

        console.log(`[WA-Booking] Saved initial booking: ${newBooking._id}`);

        // 4. Call WhatsApp service
        let whatsappMessageId = null;
        let whatsappSuccess = false;

        try {
            whatsappMessageId = await sendWhatsAppMessage({
                phone: formattedPhone,
                name,
                hotel,
                date: checkInDate,
                mapLink
            });
            whatsappSuccess = true;
        } catch (waError) {
            console.error(`[WA-Booking] WhatsApp delivery failed for booking ${newBooking._id}:`, waError.message);
            // We do not return 500 immediately; the prompt says "Return 500 if WA fails"
            // Wait, let's respect the "Return 500 if WA fails" logic!
            // Actually prompt also says:
            // "If WhatsApp fails: { success: false, message: 'Booking saved but WhatsApp failed' }"
            // Returning 500 with that JSON response matches standard REST while still providing the exact format demanded.

            return res.status(500).json({
                success: false,
                message: "Booking saved but WhatsApp failed",
                error: waError.message
            });
        }

        // 5. Store WhatsApp message ID in DB
        if (whatsappSuccess && whatsappMessageId) {
            newBooking.whatsappMessageId = whatsappMessageId;
            await newBooking.save();
            console.log(`[WA-Booking] Updated booking ${newBooking._id} with WA ID: ${whatsappMessageId}`);
        }

        // 6. Return JSON success response
        return res.status(200).json({
            success: true,
            message: "Booking confirmed and WhatsApp sent",
            bookingId: newBooking._id,
            whatsappMessageId: whatsappMessageId
        });

    } catch (error) {
        console.error('[WA-Booking] Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred processing your booking."
        });
    }
};
