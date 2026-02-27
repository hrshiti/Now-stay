// services/whatsapp.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const sendWhatsAppMessage = async ({ phone, name, hotel, date, mapLink }) => {
    try {
        const {
            WA_API_URL,
            WA_USER,
            WA_PASS,
            WA_SENDER,
            WA_TEMPLATE
        } = process.env;

        if (!WA_API_URL || !WA_USER || !WA_PASS || !WA_SENDER || !WA_TEMPLATE) {
            throw new Error('Missing required WhatsApp environment variables');
        }

        // Replace literal commas in values with encoded comma (%2C) 
        // because the provider uses literal comma as a parameter separator.
        const safeName = name ? name.toString().replace(/,/g, '%2C') : '';
        const safeHotel = hotel ? hotel.toString().replace(/,/g, '%2C') : '';
        const safeDate = date || '';
        const safeMapLink = mapLink ? mapLink.toString().replace(/,/g, '%2C') : 'Google maps link';

        // Format phone number: Remove non-digits and ensure 91 prefix
        let cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
        if (cleanPhone.length === 10) {
            cleanPhone = `91${cleanPhone}`;
        } else if (cleanPhone.length > 10 && !cleanPhone.startsWith('91')) {
            cleanPhone = `91${cleanPhone.slice(-10)}`;
        }

        const params = `${safeName},${safeHotel},${safeDate},${safeMapLink}`;

        // Create form data using URLSearchParams for application/x-www-form-urlencoded
        const formData = new URLSearchParams();
        formData.append('user', WA_USER);
        formData.append('pass', WA_PASS);
        formData.append('sender', WA_SENDER);
        formData.append('phone', cleanPhone);
        formData.append('text', WA_TEMPLATE);
        formData.append('priority', 'wa');
        formData.append('stype', 'normal');
        formData.append('Params', params);

        console.log('Sending WhatsApp via Provider:', {
            url: WA_API_URL,
            phone: cleanPhone,
            params: params
        });

        // Send POST request with form-encoded data
        const response = await axios.post(WA_API_URL, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const responseData = response.data;
        console.log('WhatsApp API Response:', responseData);

        // Provider success response format typically starts with "S." followed by Message ID
        if (typeof responseData === 'string' && responseData.includes('S.')) {
            // Extract the message ID avoiding the "S." prefix
            const match = responseData.match(/S\.(\d+)/);
            return match ? match[1] : responseData;
        } else {
            throw new Error(`WhatsApp API Error: ${responseData}`);
        }
    } catch (error) {
        console.error('WhatsApp Service Error:', error.message);
        throw error;
    }
};
