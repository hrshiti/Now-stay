import axios from 'axios';

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WA_API_URL;
    this.user = process.env.WA_USER;
    this.pass = process.env.WA_PASS;
    this.sender = process.env.WA_SENDER;
    this.template = process.env.WA_TEMPLATE;
  }

  normalizePhoneNumber(phone) {
    let cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length > 10 && !cleanPhone.startsWith('91')) {
      cleanPhone = `91${cleanPhone.slice(-10)}`;
    }
    return cleanPhone;
  }

  async sendBookingConfirmation(booking) {
    try {
      const { WA_API_URL, WA_USER, WA_PASS, WA_SENDER, WA_TEMPLATE } = process.env;
      const apiUrl = this.apiUrl || WA_API_URL;
      const user = this.user || WA_USER;
      const pass = this.pass || WA_PASS;
      const sender = this.sender || WA_SENDER;
      const template = this.template || WA_TEMPLATE;

      if (!apiUrl || !user || !pass) {
        console.warn('⚠️ [WhatsApp] Missing API credentials. Notification NOT SENT.');
        return { success: false, error: 'Missing credentials' };
      }

      // Populate booking if needed (expecting populated userId and propertyId)
      const userData = booking.userId;
      const propertyData = booking.propertyId;

      if (!userData || !userData.phone) {
        console.warn('⚠️ [WhatsApp] No user phone found.');
        return { success: false, error: 'No phone number' };
      }

      // Values for the 4 parameters in template
      const name = userData.name || 'Guest';
      const hotel = propertyData?.propertyName || 'Hotel';
      const date = new Date(booking.checkInDate).toLocaleDateString('en-GB'); // DD/MM/YYYY or YYYY-MM-DD as per provider

      // Google Maps Link
      let mapLink = 'Google maps link';
      if (propertyData?.location?.coordinates && propertyData.location.coordinates.length === 2) {
        const [lng, lat] = propertyData.location.coordinates;
        mapLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      } else if (propertyData?.address) {
        const addr = propertyData.address.fullAddress || propertyData.address.city || propertyData.propertyName;
        mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
      }

      // Cleanup data (Replace commas with %2C because provider uses comma as separator)
      const safeName = name.toString().replace(/,/g, '%2C');
      const safeHotel = hotel.toString().replace(/,/g, '%2C');
      const safeDate = date.toString().replace(/,/g, '%2C');
      const safeMapLink = mapLink.toString().replace(/,/g, '%2C');

      const paramsString = `${safeName},${safeHotel},${safeDate},${safeMapLink}`;
      const cleanPhone = this.normalizePhoneNumber(userData.phone);

      // Create Form Data
      const formData = new URLSearchParams();
      formData.append('user', user);
      formData.append('pass', pass);
      formData.append('sender', sender);
      formData.append('phone', cleanPhone);
      formData.append('text', template);
      formData.append('priority', 'wa');
      formData.append('stype', 'normal');
      formData.append('Params', paramsString);

      console.log(`📨 [WhatsApp] Sending booking confirmation to ${cleanPhone}...`);
      
      const response = await axios.post(apiUrl, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 20000
      });

      console.log('📨 [WhatsApp] Response:', response.data);

      if (typeof response.data === 'string' && response.data.includes('S.')) {
        console.log('✅ WhatsApp Notification Sent Successfully');
        return { success: true, messageId: response.data };
      } else {
        console.warn('⚠️ WhatsApp API returned unexpected response:', response.data);
        return { success: false, error: response.data };
      }

    } catch (error) {
      console.error('❌ WhatsApp Service Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new WhatsAppService();
