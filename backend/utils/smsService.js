import axios from 'axios';

class PRPSMSService {
  constructor() {
    this.apiKey = process.env.PRPSMS_API_KEY;
    this.senderId = process.env.PRPSMS_SENDER_ID || 'VRUSOY';
    this.otpTemplate = process.env.PRPSMS_OTP_TEMPLATE || 'temp 2';
    this.baseUrl = 'https://api.bulksmsadmin.com/BulkSMSapi/keyApiSendSMS/SendSmsTemplateName';
  }

  normalizePhoneNumber(phone) {
    const digits = phone.replace(/[^0-9]/g, '');
    // Remove leading 91 or 0 if present, then take last 10 digits
    // The PRPSMS API might expect 10 digits or with 91, but usually 10 for mobileNo in Indian APIs
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  }

  async sendOTP(phone, otp) {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    console.log(`📨 [PRPSMS] Sending OTP to ${normalizedPhone} using template ${this.otpTemplate}...`);

    const payload = {
      sender: this.senderId,
      templateName: this.otpTemplate,
      smsReciever: [
        {
          mobileNo: normalizedPhone,
          templateParams: String(otp)
        }
      ]
    };

    try {
      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      console.log('📬 [PRPSMS] Response:', JSON.stringify(response.data));

      // According to the PHP snippet: if ($response->successful())
      // Axios status in 2xx range is successful.
      if (response.status >= 200 && response.status < 300) {
        return { success: true, response: response.data };
      }

      return { success: false, error: `HTTP ${response.status}`, response: response.data };

    } catch (error) {
      console.error('❌ [PRPSMS] Error:', error.response ? JSON.stringify(error.response.data) : error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * General SMS sending (e.g., booking alerts).
   * NOTE: For template-based services, this must use a pre-approved template.
   * If a generic template isn't provided, this might need fallback logic or specific template mapping.
   */
  async sendSMS(phone, message) {
    // For now, if we don't have a template for every message, we might use the OTP one 
    // or just log that templates are required.
    // However, the existing code was sending arbitrary messages.
    // I will attempt to use the OTP template if it's broad enough, 
    // but usually PRPSMS requires matching templates.

    console.warn('⚠️ [PRPSMS] sendSMS called with custom message. PRPSMS is template-based.');
    // Fallback: If it's just an OTP, we can redirect to sendOTP.
    // In authController, booking alerts are also sent.

    // For now, I'll return a message that templates are needed.
    return { success: false, error: 'PRPSMS requires pre-approved templates for custom messages.' };
  }
}

export default new PRPSMSService();
